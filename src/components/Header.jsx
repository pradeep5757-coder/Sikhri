import { useState } from 'react';
import { Image, SimpleGrid, UnstyledButton } from '@mantine/core';
import logo from '../assets/sikhri-logo.png';
import { REGIONS } from '../config/constants';

export function Logo() {
  return <Image className="sd-logo" src={logo} alt="SikhRI" w="auto" h={84} fit="contain" />;
}

/** "Donating from USA / Global · USD  Change" + the 3-way region switch. */
export function RegionPicker({ d, set }) {
  const [open, setOpen] = useState(false);
  const r = REGIONS[d.region];

  return (
    <div className="sd-region">
      <p className="sd-region-line">
        <span>
          Donating from <strong>{r.label}</strong> · {r.currency}
        </span>
        <button type="button" className="sd-link" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Change'}
        </button>
      </p>
      {open && (
        <SimpleGrid cols={3} spacing={8} className="sd-region-list" role="group" aria-label="Where are you donating from?">
          {Object.keys(REGIONS).map((id) => (
            <UnstyledButton
              key={id}
              className="sd-region-opt"
              aria-pressed={d.region === id}
              onClick={() => {
                set({ region: id });
                setOpen(false);
              }}
            >
              <strong>{REGIONS[id].label}</strong>
              <span>Gifts in {REGIONS[id].currency}</span>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      )}
    </div>
  );
}
