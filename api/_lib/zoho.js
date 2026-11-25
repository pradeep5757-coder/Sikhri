// Calls the Zoho CRM standalone function "Stripe_sandbox" (REST API, API-key auth).
// ZOHO_CRM_FUNCTION_URL = https://www.zohoapis.com/crm/v7/functions/stripe_sandbox/actions/execute?auth_type=apikey&zapikey=<key>
// The function takes crmAPIRequest and reads the raw JSON body as a Stripe event:
//   { id, type: "payment_intent.succeeded", livemode, data: { object: <PaymentIntent> } }

const FUNCTION_URL = process.env.ZOHO_CRM_FUNCTION_URL || '';

export const zohoConfigured = () => FUNCTION_URL !== '';

export async function callZohoFunction(event) {
  if (!zohoConfigured()) {
    console.info('[zoho] ZOHO_CRM_FUNCTION_URL not set, skipping.', event?.type, event?.data?.object?.id);
    return { ok: true, skipped: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }
    const ok = res.ok && data?.code === 'success';
    if (ok) console.info('[zoho] ok', event?.data?.object?.id, data?.details?.output);
    else console.error('[zoho] function call failed', res.status, raw.slice(0, 1000));
    return { ok, status: res.status, output: data?.details?.output };
  } catch (err) {
    console.error('[zoho] request error', err?.name, err?.message);
    return { ok: false, error: err?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
