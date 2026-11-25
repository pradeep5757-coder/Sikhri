import { useCallback, useState } from 'react';
import { REGIONS, FUNDS, FEE, presetsFor } from '../config/constants';
import { detectRegion } from '../lib/region';

function initialState() {
  const region = detectRegion();
  return {
    region,
    frequency: 'monthly',
    amount: presetsFor('monthly').start,
    custom: '',
    fund: FUNDS[0].value,
    feePercent: FEE.startPercent,
    giftAid: { personal: '', want: '', agreed: false },
    optIn: REGIONS[region].optIn,
    extrasOpen: false,
    commentOn: true,
    comment: '',
    dedicationOn: false,
    dedication: { name: '', email: '', message: '' },
    institution: { on: false, type: '', name: '' },
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: { line1: '', line2: '', city: '', state: '', postal: '', country: REGIONS[region].country },
    method: 'card', // card | bank | paypal | apple_pay | google_pay
  };
}

/**
 * Single source of truth for the whole form.
 * `set(patch)` merges a partial update and applies the same side effects as the live page:
 *  - changing region moves the default country, drops "bank" where unsupported,
 *    resets Gift Aid answers and the newsletter default
 *  - changing region or frequency resets the amount to that preset's start (unless a custom amount is typed)
 */
export function useDonation() {
  const [d, setD] = useState(initialState);

  const set = useCallback((patch) => {
    setD((prev) => {
      const next = { ...prev, ...patch };
      const regionChanged = patch.region && patch.region !== prev.region;

      if (regionChanged && prev.address.country === REGIONS[prev.region].country) {
        next.address = { ...next.address, country: REGIONS[patch.region].country };
      }
      if (regionChanged) {
        const r = REGIONS[patch.region];
        if (!r.bank && next.method === 'bank') next.method = 'card';
        next.giftAid = { personal: '', want: '', agreed: false };
        next.optIn = r.optIn;
      }
      if (((patch.frequency && patch.frequency !== prev.frequency) || regionChanged) && !next.custom) {
        next.amount = presetsFor(next.frequency).start;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setD(initialState()), []);

  return { d, set, reset };
}
