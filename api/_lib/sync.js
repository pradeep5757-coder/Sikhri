// Sends each successful payment to the Zoho function once, as a Stripe
// "payment_intent.succeeded" event (the shape Stripe_sandbox reads).
// The PaymentIntent is marked with crm_synced_at so the browser confirm and the
// webhook never send it twice (Stripe_sandbox also skips duplicates by Payment Intent ID).

import { callZohoFunction } from './zoho.js';

const idOf = (x) => (typeof x === 'string' ? x : x?.id || '');

/**
 * opts.metadata  - donation fields to use (renewals pass the subscription's metadata,
 *                  because Stripe creates renewal payments without our metadata)
 */
export async function syncSuccessfulPayment(stripe, region, paymentIntentId, opts = {}) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') return { synced: false, reason: `payment ${pi.status}` };
  if (pi.metadata?.crm_synced_at) return { synced: true, already: true };

  const metadata = { ...(opts.metadata || {}), ...pi.metadata };
  if (!metadata.region) metadata.region = region;
  if (opts.giftType) metadata.gift_type = opts.giftType;
  if (opts.subscriptionId) metadata.stripe_subscription_id = opts.subscriptionId;
  if (opts.invoiceId) metadata.stripe_invoice_id = opts.invoiceId;

  const event = {
    id: `evt_sikhri_${pi.id}`,
    object: 'event',
    type: 'payment_intent.succeeded',
    livemode: pi.livemode,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        ...pi,
        customer: idOf(pi.customer),
        latest_charge: idOf(pi.latest_charge),
        receipt_email: pi.receipt_email || metadata.email || null,
        metadata,
      },
    },
  };

  const result = await callZohoFunction(event);
  if (!result.ok) return { synced: false, reason: 'zoho_error', result };

  await stripe.paymentIntents.update(pi.id, {
    metadata: { crm_synced_at: new Date().toISOString(), crm_result: result.skipped ? 'skipped' : 'ok' },
  });
  return { synced: true, skipped: !!result.skipped };
}

/**
 * Refunds, disputes, failures, cancellations. Stripe_sandbox only handles
 * payment_intent.succeeded today, so these are logged, not sent. Extend the
 * Zoho function first, then forward them here.
 */
export async function syncStatusChange(payload) {
  console.info('[zoho] status change (not sent, function handles successes only)', JSON.stringify(payload).slice(0, 500));
  return { synced: false, skipped: true };
}
