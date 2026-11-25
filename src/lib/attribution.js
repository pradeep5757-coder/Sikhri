// Marketing attribution sent with every donation (stored in Stripe metadata, passed to Zoho).
// Order: URL ?utm_* first, then SikhRI's first-party `sikhri_attr` cookie, then Google Analytics cookies.
// Missing consent or cookies never block a donation; values just stay empty.

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function readCookie(name) {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : '';
}

/** _ga = "GA1.1.1234567890.1700000000" -> client id "1234567890.1700000000" */
function gaClientIdFromCookie() {
  const parts = readCookie('_ga').split('.');
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : '';
}

/** _ga_<ID> = "GS1.1.1700000000.3.1..." or "GS2.1.s1700000000$o3$g1..." -> session id "1700000000" */
function gaSessionIdFromCookie() {
  const hit = document.cookie.split('; ').find((c) => /^_ga_[A-Z0-9]+=/.test(c));
  if (!hit) return '';
  const value = hit.split('=')[1] || '';
  const gs2 = value.match(/\bs(\d{6,})/);
  if (value.startsWith('GS2') && gs2) return gs2[1];
  const parts = value.split('.');
  return parts.length >= 3 && /^\d+$/.test(parts[2]) ? parts[2] : '';
}

export function collectAttribution() {
  const out = Object.fromEntries([...UTM, 'ga_client_id', 'ga_session_id'].map((k) => [k, '']));
  try {
    const url = new URLSearchParams(window.location.search);
    UTM.forEach((k) => {
      out[k] = url.get(k) || '';
    });
    const raw = readCookie('sikhri_attr');
    if (raw) {
      const cookie = new URLSearchParams(decodeURIComponent(raw));
      Object.keys(out).forEach((k) => {
        if (!out[k]) out[k] = cookie.get(k) || '';
      });
    }
    if (!out.ga_client_id) out.ga_client_id = gaClientIdFromCookie();
    if (!out.ga_session_id) out.ga_session_id = gaSessionIdFromCookie();
  } catch {
    /* never block a donation on attribution */
  }
  return out;
}

/** GA4 / GTM success event, same shape as the old success page. */
export function pushDonationSuccess(result) {
  if (!result?.paymentIntentId) return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'donation_success',
      donation_amount: Number(result.amount) || 0,
      donation_currency: result.currency || '',
      donation_fund: result.fund || '',
      donation_frequency: result.frequency || '',
      payment_status: result.status || '',
      stripe_payment_intent_id: result.paymentIntentId,
    });
  } catch {
    /* tracking must never break the thank-you page */
  }
}
