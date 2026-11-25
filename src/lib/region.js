const CANADA_TZ =
  /^(Canada\/.+|America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Thunder_Bay|Swift_Current|Dawson|Dawson_Creek|Fort_Nelson|Cambridge_Bay|Rankin_Inlet|Resolute|Inuvik|Creston|Atikokan|Coral_Harbour|Blanc-Sablon|Nipigon|Rainy_River|Pangnirtung))$/;
const UK_TZ = new Set(['Europe/London', 'Europe/Belfast', 'GB', 'GB-Eire']);

const regionFromTimeZone = (tz) => (CANADA_TZ.test(tz) ? 'CA' : UK_TZ.has(tz) ? 'UK' : 'US');

/** ?region=US|CA|UK|GB wins, otherwise guess from the browser time zone. */
export function detectRegion() {
  const q = new URLSearchParams(window.location.search).get('region')?.toUpperCase();
  if (q === 'US' || q === 'CA' || q === 'UK') return q;
  if (q === 'GB') return 'UK';
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    tz = '';
  }
  return regionFromTimeZone(tz);
}

/** ?paypal=1 shows the PayPal option. */
export const paypalEnabled = () => new URLSearchParams(window.location.search).get('paypal') === '1';

/** ?share=menu|row forces a share layout; otherwise native share on touch devices. */
export function shareMode() {
  const q = new URLSearchParams(window.location.search).get('share');
  if (q === 'menu' || q === 'row') return q;
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches ? 'menu' : 'row';
}
