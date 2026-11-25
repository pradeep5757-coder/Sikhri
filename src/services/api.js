// Browser client for the Vercel API (/api/*).
// VITE_API_BASE lets the same build call the API from another site (e.g. Webflow):
//   VITE_API_BASE=https://sikhri-donation-form.vercel.app
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

async function request(path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

import { collectAttribution } from '../lib/attribution';

export const getSettings = () => request('/api/settings');

export function createPayment(d, method) {
  return request('/api/create-payment', {
    ...d,
    method,
    attribution: collectAttribution(),
    pageUrl: window.location.href.split('?')[0],
  });
}

export const confirmDonation = (region, paymentIntentId) => request('/api/confirm-donation', { region, paymentIntentId });
