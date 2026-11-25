import { loadStripe } from '@stripe/stripe-js';
import { REGIONS } from '../config/constants';
import { totalToPay } from './money';

const cache = new Map();
export function stripePromiseFor(publishableKey) {
  if (!publishableKey) return null;
  if (!cache.has(publishableKey)) cache.set(publishableKey, loadStripe(publishableKey));
  return cache.get(publishableKey);
}

// Stripe Elements styled to match the form.
export const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#BFA25A',
    colorText: '#212121',
    colorTextSecondary: '#6B6B6B',
    colorDanger: '#C1442E',
    colorBackground: '#ffffff',
    fontFamily: 'Avenir Next, Avenir, Arial, sans-serif',
    fontSizeBase: '16px',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #DDDDDD', boxShadow: 'none', padding: '16px 13px' },
    '.Input:focus': { border: '1px solid #8F7534', boxShadow: '0 0 0 1px #8F7534' },
    '.Input--invalid': { border: '1px solid #C1442E', boxShadow: '0 0 0 1px #C1442E' },
    '.Label': { color: '#6B6B6B', fontSize: '13px' },
    '.Tab': { border: '1px solid #DDDDDD', boxShadow: 'none' },
    '.Tab--selected': { borderColor: '#BFA25A', boxShadow: '0 0 0 1px #BFA25A' },
  },
};

/** Stripe payment method types for the donor's choice (must match the server). */
export function methodTypes(region, method) {
  if (method === 'bank') return [region === 'CA' ? 'acss_debit' : 'us_bank_account'];
  if (method === 'paypal') return ['paypal'];
  return ['card'];
}

/** Options for an Elements provider created before the payment exists ("deferred" mode). */
export function deferredOptions(d, types) {
  return {
    mode: d.frequency === 'one_time' ? 'payment' : 'subscription',
    amount: Math.round(totalToPay(d) * 100),
    currency: REGIONS[d.region].currency.toLowerCase(),
    allowedPaymentMethodTypes: types, // Stripe.js (endive) name; must match payment_method_types on the server
    appearance,
  };
}

/** Billing details we already collected, so the Payment Element doesn't ask again. */
export function billingDetails(d) {
  return {
    name: `${d.firstName} ${d.lastName}`.trim(),
    email: d.email.trim(),
    phone: d.phone.trim(),
    address: {
      line1: d.address.line1,
      line2: d.address.line2 || '',
      city: d.address.city,
      state: d.address.state || '',
      postal_code: d.address.postal,
      country: d.address.country,
    },
  };
}

/** Where Stripe sends donors back after a redirect (PayPal, bank or 3-D Secure pages). */
export function returnUrl(d) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('region', d.region);
  url.searchParams.set('return', '1');
  return url.toString();
}

export const rememberDonor = (d) => {
  try {
    sessionStorage.setItem('sikhri_first_name', d.firstName.trim());
  } catch {
    /* storage unavailable */
  }
};
export const rememberedFirstName = () => {
  try {
    return sessionStorage.getItem('sikhri_first_name') || '';
  } catch {
    return '';
  }
};
