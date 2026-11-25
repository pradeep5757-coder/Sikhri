// POST /api/confirm-donation { region, paymentIntentId }
// Called by the browser right after Stripe confirms the payment (or after a redirect back).
// Checks the real status with Stripe, then records successful payments in Zoho.
// The webhook does the same thing as a safety net, so it is safe to call more than once.
import { regionConfig } from './_lib/config.js';
import { handle, json, readJson } from './_lib/http.js';
export { OPTIONS } from './_lib/http.js';
import { HttpError, stripeFor } from './_lib/stripe.js';
import { syncSuccessfulPayment } from './_lib/sync.js';

/** What the thank-you page and the analytics event need — nothing sensitive. */
const summary = (pi) => ({
  paymentIntentId: pi.id,
  firstName: pi.metadata?.first_name || '',
  amount: Number(pi.metadata?.total_amount) || pi.amount / 100,
  currency: (pi.currency || '').toUpperCase(),
  fund: pi.metadata?.fund || '',
  frequency: pi.metadata?.frequency || '',
});

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const region = String(body.region || '').toUpperCase();
  const paymentIntentId = String(body.paymentIntentId || '');
  const cfg = regionConfig(region);
  if (!cfg) throw new HttpError(400, 'Invalid region.');
  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) throw new HttpError(400, 'Invalid payment reference.');

  const stripe = stripeFor(cfg);
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['invoice'] });

  if (pi.status === 'succeeded') {
    const invoice = pi.invoice && typeof pi.invoice === 'object' ? pi.invoice : null;
    const crm = await syncSuccessfulPayment(stripe, region, pi.id, {
      giftType: invoice?.billing_reason === 'subscription_cycle' ? 'Renewal' : 'New Gift',
      subscriptionId: typeof invoice?.subscription === 'string' ? invoice.subscription : invoice?.subscription?.id,
      invoiceId: invoice?.id,
    });
    return json({ ...summary(pi), status: 'succeeded', crm: { recorded: crm.synced, skipped: !!crm.skipped } });
  }

  if (pi.status === 'processing') {
    // Bank debits take a few days; the webhook records them in Zoho when they clear.
    return json({ ...summary(pi), status: 'processing' });
  }

  return json({ status: pi.status, error: pi.last_payment_error?.message || 'The payment was not completed.' }, 402);
});
