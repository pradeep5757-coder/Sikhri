import { useEffect, useState } from 'react';
import { Checkbox } from '@mantine/core';
import { INSTITUTION_TYPES } from '../config/constants';
import { getCountries } from '../lib/countries';
import { addressLookup } from '../lib/addressLookup';
import { FloatingField } from './FloatingField';
import { CHECK_CLASSES } from './GiftAid';

export function InstitutionFields({ d, set, errors }) {
  const inst = d.institution;
  const setInst = (patch) => set({ institution: { ...inst, ...patch } });

  return (
    <div className="sd-inst">
      <Checkbox
        className="sd-check"
        classNames={CHECK_CLASSES}
        color="gold"
        checked={inst.on}
        onChange={(e) => setInst({ on: e.currentTarget.checked })}
        label="This donation is from an institution"
      />
      {inst.on && (
        <div className="sd-inst-fields">
          <FloatingField
            as="select"
            label="Institution type"
            error={errors.instType}
            value={inst.type}
            data={[{ value: '', label: 'Select a type' }, ...INSTITUTION_TYPES]}
            onChange={(e) => setInst({ type: e.currentTarget.value })}
          />
          <FloatingField label="Institution name" error={errors.instName} autoComplete="organization" value={inst.name} onChange={(e) => setInst({ name: e.currentTarget.value })} />
        </div>
      )}
    </div>
  );
}

function AddressFields({ d, set, errors }) {
  const addr = d.address;
  const setAddr = (patch) => set({ address: { ...addr, ...patch } });
  const [manual, setManual] = useState(addr.line1 !== '');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);

  useEffect(() => {
    let alive = true;
    addressLookup.suggest(query, addr.country).then((h) => alive && setHits(h));
    return () => {
      alive = false;
    };
  }, [query, addr.country]);

  const stateLabel = addr.country === 'US' ? 'State' : addr.country === 'CA' ? 'Province' : addr.country === 'GB' ? 'County' : 'State or province';
  const postalLabel = addr.country === 'US' ? 'ZIP code' : addr.country === 'GB' ? 'Postcode' : 'Postal code';

  return (
    <>
      <FloatingField as="select" label="Country" autoComplete="country" error={errors.country} value={addr.country} data={getCountries()} onChange={(e) => setAddr({ country: e.currentTarget.value })} />

      {manual ? (
        <>
          <FloatingField label="Street address" autoComplete="address-line1" error={errors.line1} value={addr.line1} onChange={(e) => setAddr({ line1: e.currentTarget.value })} />
          <FloatingField label="Address line 2" autoComplete="address-line2" value={addr.line2} onChange={(e) => setAddr({ line2: e.currentTarget.value })} />
          <div className="sd-row sd-row--3">
            <FloatingField label="City" autoComplete="address-level2" error={errors.city} value={addr.city} onChange={(e) => setAddr({ city: e.currentTarget.value })} />
            <FloatingField label={stateLabel} optional={addr.country === 'GB'} autoComplete="address-level1" value={addr.state} onChange={(e) => setAddr({ state: e.currentTarget.value })} />
            <FloatingField label={postalLabel} autoComplete="postal-code" error={errors.postal} value={addr.postal} onChange={(e) => setAddr({ postal: e.currentTarget.value })} />
          </div>
        </>
      ) : (
        <>
          <FloatingField label="Search address" autoComplete="off" error={errors.line1} value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
          {hits.length > 0 && (
            <ul className="sd-hits" aria-label="Matching addresses">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      set({ address: { ...h.address } });
                      setManual(true);
                    }}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
              {addressLookup.sample && <li className="sd-hits-note">Sample results. Live address lookup connects later.</li>}
            </ul>
          )}
          <FloatingField label="Address line 2" autoComplete="address-line2" value={addr.line2} onChange={(e) => setAddr({ line2: e.currentTarget.value })} />
          <button
            type="button"
            className="sd-link sd-add"
            onClick={() => {
              setAddr({ line1: query });
              setManual(true);
            }}
          >
            Enter address by hand
          </button>
        </>
      )}
    </>
  );
}

export function DonorFields({ d, set, errors }) {
  return (
    <>
      <div className="sd-row sd-row--2">
        <FloatingField label="First name" autoComplete="given-name" error={errors.firstName} value={d.firstName} onChange={(e) => set({ firstName: e.currentTarget.value })} />
        <FloatingField label="Last name" autoComplete="family-name" error={errors.lastName} value={d.lastName} onChange={(e) => set({ lastName: e.currentTarget.value })} />
      </div>
      <FloatingField label="Email" type="email" inputMode="email" autoComplete="email" error={errors.email} value={d.email} onChange={(e) => set({ email: e.currentTarget.value })} />
      <FloatingField label="Phone" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone} value={d.phone} onChange={(e) => set({ phone: e.currentTarget.value })} />
      <AddressFields d={d} set={set} errors={errors} />
    </>
  );
}
