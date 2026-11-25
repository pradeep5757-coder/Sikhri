import { HttpError } from './stripe.js';

// Origins allowed to call the API from a browser (the Vercel site itself, Webflow, sikhri.org).
// Override with ALLOWED_ORIGINS="https://a.com,https://b.com". *.webflow.io is always allowed for staging.
const DEFAULT_ORIGINS = ['https://sikhri-donation-form.vercel.app', 'https://sikhri.org', 'https://www.sikhri.org', 'https://localhost:5173', 'http://localhost:5173'];
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const origins = ALLOWED.length ? ALLOWED : DEFAULT_ORIGINS;

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const ok = origins.includes(origin) || /^https:\/\/[a-z0-9-]+\.webflow\.io$/i.test(origin);
  return ok
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {};
}

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Invalid request body.');
  }
}

/** Preflight handler for cross-origin (Webflow) calls. */
export const OPTIONS = (request) => new Response(null, { status: 204, headers: corsHeaders(request) });

/** Wraps a handler: CORS + known errors -> their status, Stripe errors -> 400/502, everything else -> 500. */
export const handle = (fn) => async (request) => {
  const cors = corsHeaders(request);
  let res;
  try {
    res = await fn(request);
  } catch (err) {
    if (err instanceof HttpError) res = json({ error: err.message }, err.status);
    else if (err?.type && String(err.type).startsWith('Stripe')) {
      console.error('[stripe]', err.type, err.code, err.message);
      res = json({ error: err.message || 'Payment provider error.' }, err.statusCode && err.statusCode < 500 ? 400 : 502);
    } else {
      console.error('[api] unexpected error', err);
      res = json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  }
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  return res;
};
