// Region + Stripe configuration, read from Vercel environment variables.
// One key pair works for all regions (same as config.php); per-region overrides are optional:
//   STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
//   STRIPE_SECRET_KEY_US, STRIPE_PUBLISHABLE_KEY_CA, STRIPE_WEBHOOK_SECRET_UK, ...

const REGIONS = {
  US: { currency: 'usd', country: 'US' },
  CA: { currency: 'cad', country: 'CA' },
  UK: { currency: 'gbp', country: 'GB' },
};

export const FUNDS = ['Unrestricted', 'Sidak Leadership Program for Young Adults', 'The Guru Granth Sahib Project for Seekers'];
export const FEE_MAX_PERCENT = 15;
export const GIFT_AID_RATE = 0.25;
export const INSTITUTION_TYPES = ['Corporation', 'Foundation', 'Place of Worship', 'Government', 'Other'];

const env = (name, region) => process.env[`${name}_${region}`] || process.env[name] || '';

export function regionConfig(region) {
  const meta = REGIONS[region];
  if (!meta) return null;
  return {
    region,
    ...meta,
    secretKey: env('STRIPE_SECRET_KEY', region),
    publishableKey: env('STRIPE_PUBLISHABLE_KEY', region),
    webhookSecret: env('STRIPE_WEBHOOK_SECRET', region),
  };
}

export const REGION_IDS = Object.keys(REGIONS);
