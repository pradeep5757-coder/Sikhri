// POST /api/stripe-webhook?region=US|CA|UK
// Safety net + lifecycle events: records payments that the browser didn't confirm
// (closed tab, bank debits that clear later, monthly renewals) and status changes.
import { regionConfig } from './_lib/config.js';
import { json } from './_lib/http.js';
import { fromMinor, stripeFor } from './_lib/stripe.js';
import { syncStatusChange, syncSuccessfulPayment } from './_lib/sync.js';

const idOf = (x) => (typeof x === 'string' ? x : x?.id || '');

export async function POST(request) {
  const region = (new URL(request.url).searchParams.get('region') || '').toUpperCase();
  const cfg = regionConfig(region);
  if (!cfg) return json({ error: 'Invalid region' }, 400);
  if (!cfg.webhookSecret) return json({ error: 'Webhook secret not configured' }, 500);

  const stripe = stripeFor(cfg);
  const raw = await request.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, request.headers.get('stripe-signature') || '', cfg.webhookSecret);
  } catch (err) {
    console.warn('[webhook] bad signature', err.message);
    return json({ error: 'Invalid signature' }, 400);
  }

  try {
    const result = await handleEvent(stripe, region, event);
    return json({ received: true, type: event.type, ...result });
  } catch (err) {
    console.error('[webhook] failed', event.type, event.id, err);
    return json({ error: 'processing failed' }, 500); // Stripe retries
  }
}

async function handleEvent(stripe, region, event) {
  const obj = event.data.object;

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = await stripe.paymentIntents.retrieve(obj.id);
      if (pi.invoice) return { skipped: 'subscription payment, handled by invoice.paid' };
      return syncSuccessfulPayment(stripe, region, pi.id, { giftType: 'New Gift' });
    }

    case 'invoice.paid': {
      // Re-read with the pinned API version so payment_intent/subscription are present.
      const invoice = await stripe.invoices.retrieve(obj.id);
      const piId = idOf(invoice.payment_intent);
      const subId = idOf(invoice.subscription);
      if (!piId) return { skipped: 'no payment (zero amount invoice)' };
      const sub = subId ? await stripe.subscriptions.retrieve(subId) : null;
      return syncSuccessfulPayment(stripe, region, piId, {
        metadata: sub?.metadata,
        giftType: invoice.billing_reason === 'subscription_cycle' ? 'Renewal' : 'New Gift',
        subscriptionId: subId,
        invoiceId: invoice.id,
      });
    }

    case 'payment_intent.payment_failed':
      return syncStatusChange({
        ...obj.metadata,
        region,
        event: 'payment_failed',
        payment_status: 'Failed',
        failure_reason: obj.last_payment_error?.message || '',
        stripe_payment_intent_id: obj.id,
        stripe_customer_id: idOf(obj.customer),
      });

    case 'invoice.payment_failed': {
      const invoice = await stripe.invoices.retrieve(obj.id);
      const sub = invoice.subscription ? await stripe.subscriptions.retrieve(idOf(invoice.subscription)) : null;
      return syncStatusChange({
        ...(sub?.metadata || {}),
        region,
        event: 'payment_failed',
        payment_status: 'Failed',
        gift_type: invoice.billing_reason === 'subscription_cycle' ? 'Renewal' : 'New Gift',
        stripe_payment_intent_id: idOf(invoice.payment_intent),
        stripe_subscription_id: idOf(invoice.subscription),
        stripe_invoice_id: invoice.id,
        stripe_customer_id: idOf(invoice.customer),
      });
    }

    case 'charge.refunded':
      return syncStatusChange({
        region,
        event: 'refund',
        payment_status: obj.amount_refunded >= obj.amount ? 'Refunded' : 'Partially Refunded',
        refunded_amount: fromMinor(obj.amount_refunded),
        stripe_payment_intent_id: idOf(obj.payment_intent),
        stripe_charge_id: obj.id,
      });

    case 'charge.dispute.created':
    case 'charge.dispute.closed': {
      const charge = await stripe.charges.retrieve(idOf(obj.charge));
      return syncStatusChange({
        region,
        event: 'dispute',
        payment_status: event.type === 'charge.dispute.created' ? 'Disputed' : `Dispute ${obj.status}`,
        stripe_payment_intent_id: idOf(charge.payment_intent),
        stripe_charge_id: charge.id,
      });
    }

    case 'customer.subscription.deleted':
      return syncStatusChange({
        ...obj.metadata,
        region,
        event: 'subscription_cancelled',
        subscription_status: 'Cancelled',
        stripe_subscription_id: obj.id,
        stripe_customer_id: idOf(obj.customer),
      });

    default:
      return { ignored: true };
  }
}
