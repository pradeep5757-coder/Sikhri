// Sample address provider, same as the live page. Swap `suggest` for a real
// lookup service (Loqate, Google Places, etc.) later — keep the same return shape.

const SAMPLES = [
  { line1: '100 Sample Street', line2: '', city: 'Springfield', state: 'IL', postal: '62701', country: 'US' },
  { line1: '250 Example Avenue', line2: '', city: 'Austin', state: 'TX', postal: '78701', country: 'US' },
  { line1: '18 Placeholder Court', line2: '', city: 'Fremont', state: 'CA', postal: '94536', country: 'US' },
  { line1: '12 Placeholder Road', line2: '', city: 'Surrey', state: 'BC', postal: 'V0V 0V0', country: 'CA' },
  { line1: '480 Sample Street', line2: '', city: 'Brampton', state: 'ON', postal: 'L0L 0L0', country: 'CA' },
  { line1: '9 Example Crescent', line2: '', city: 'Calgary', state: 'AB', postal: 'T0T 0T0', country: 'CA' },
  { line1: '7 Example Lane', line2: '', city: 'London', state: '', postal: 'AB1 2CD', country: 'GB' },
  { line1: '31 Placeholder Close', line2: '', city: 'Birmingham', state: '', postal: 'AB3 4EF', country: 'GB' },
  { line1: '4 Sample Terrace', line2: '', city: 'Leicester', state: '', postal: 'AB5 6GH', country: 'GB' },
];

const toLabel = (a) => [a.line1, a.city, [a.state, a.postal].filter(Boolean).join(' ')].join(', ');

export const addressLookup = {
  sample: true,
  async suggest(query, country) {
    const q = query.trim().toLowerCase();
    if (q.length < 3) return [];
    const inCountry = SAMPLES.filter((a) => a.country === country);
    const hits = inCountry.filter((a) => toLabel(a).toLowerCase().includes(q));
    return (hits.length ? hits : inCountry).map((address, i) => ({ id: `${country}-${i}`, label: toLabel(address), address }));
  },
};
