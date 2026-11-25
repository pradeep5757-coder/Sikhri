// POST /api/create-payment
// Creates (or reuses) the Stripe Customer, then a PaymentIntent (one time) or a
// Subscription (monthly), and returns the client secret for Stripe.js to confirm.
import { regionConfig } from './_lib/config.js';
import { normalizeDonation, paymentMethodTypes, toMetadata } from './_lib/donation.js';
import { handle, json, readJson } from './_lib/http.js';
export { OPTIONS } from './_lib/http.js';
import { HttpError, stripeFor, toMinor } from './_lib/stripe.js';

async function upsertCustomer(stripe, v, metadata) {
  const details = {
    email: v.email,
    name: `${v.firstName} ${v.lastName}`.trim(),
    phone: v.phone || undefined,
    address: v.address.line1 ? v.address : undefined,
    metadata: { source: 'SikhRI Website', region: v.region, newsletter_opt_in: metadata.newsletter_opt_in, ...pick(metadata, ['utm_source', 'utm_medium', 'utm_campaign']) },
  };
  const existing = await stripe.customers.list({ email: v.email, limit: 1 });
  if (existing.data[0]) return stripe.customers.update(existing.data[0].id, details);
  return stripe.customers.create(details);
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k]).map((k) => [k, obj[k]]));

/** One reusable monthly Price per fund + currency + amount (avoids creating a Price per donation). */
async function monthlyPrice(stripe, v, currency, amountMinor) {
  const slug = v.fund.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
  const lookupKey = `sikhri_monthly_${slug}_${currency}_${amountMinor}`;
  const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (found.data[0]) return found.data[0];
  return stripe.prices.create({
    currency,
    unit_amount: amountMinor,
    recurring: { interval: 'month' },
    lookup_key: lookupKey,
    product_data: { name: `SikhRI Monthly Donation - ${v.fund}` },
  });
}

export const POST = handle(async (request) => {
  const v = normalizeDonation(await readJson(request));
  const cfg = regionConfig(v.region);
  const stripe = stripeFor(cfg);
  const currency = cfg.currency;
  const amountMinor = toMinor(v.totalAmount);
  const metadata = toMetadata(v, currency);
  const types = paymentMethodTypes(v.region, v.method);
  const isAcss = types[0] === 'acss_debit';

  const customer = await upsertCustomer(stripe, v, metadata);

  if (v.frequency === 'one_time') {
    const pi = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency,
      customer: customer.id,
      payment_method_types: types,
      ...(isAcss && {
        payment_method_options: { acss_debit: { mandate_options: { payment_schedule: 'sporadic', transaction_type: 'personal' } } },
      }),
      receipt_email: v.email,
      description: `SikhRI Donation - ${v.fund}`,
      metadata,
    });
    return json({ type: 'payment', clientSecret: pi.client_secret, paymentIntentId: pi.id, customerId: customer.id });
  }

  const price = await monthlyPrice(stripe, v, currency, amountMinor);
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      payment_method_types: types,
      ...(isAcss && { payment_method_options: { acss_debit: { mandate_options: { transaction_type: 'personal' } } } }),
    },
    description: `SikhRI Monthly Donation - ${v.fund}`,
    metadata,
    expand: ['latest_invoice.payment_intent'],
  });

  const pi = subscription.latest_invoice?.payment_intent;
  if (!pi?.client_secret) throw new HttpError(502, 'Stripe did not return the first subscription payment.');

  // Keep the first payment's metadata in line with the Customer/Subscription.
  await stripe.paymentIntents.update(pi.id, { metadata, receipt_email: v.email });

  return json({ type: 'payment', clientSecret: pi.client_secret, paymentIntentId: pi.id, subscriptionId: subscription.id, customerId: customer.id });
});
