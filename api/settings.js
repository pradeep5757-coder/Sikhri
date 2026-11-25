// GET /api/settings — public config the form needs before payment (publishable keys only).
import { FUNDS, REGION_IDS, regionConfig } from './_lib/config.js';
import { handle, json } from './_lib/http.js';
export { OPTIONS } from './_lib/http.js';

export const GET = handle(async () => {
  const regions = Object.fromEntries(
    REGION_IDS.map((id) => {
      const cfg = regionConfig(id);
      return [id, { publishableKey: cfg.publishableKey, currency: cfg.currency }];
    }),
  );
  return json({ regions, funds: FUNDS });
});
