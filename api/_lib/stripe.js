import Stripe from 'stripe';

// Pinned so invoice.payment_intent / latest_invoice.payment_intent keep working
// regardless of the account's default API version.
export const STRIPE_API_VERSION = '2024-06-20';

const clients = new Map();

export function stripeFor(cfg) {
  if (!cfg?.secretKey) throw new HttpError(500, `Stripe is not configured for ${cfg?.region || 'this region'}.`);
  if (!clients.has(cfg.secretKey)) {
    clients.set(cfg.secretKey, new Stripe(cfg.secretKey, { apiVersion: STRIPE_API_VERSION, maxNetworkRetries: 2 }));
  }
  return clients.get(cfg.secretKey);
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const toMinor = (n) => Math.round(Number(n) * 100);
export const fromMinor = (n) => Math.round(Number(n || 0)) / 100;
