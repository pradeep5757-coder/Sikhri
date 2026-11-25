import { Drawer, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { REGIONS } from '../config/constants';

const REGION_IDS = Object.keys(REGIONS);
const shortLabel = (id) => (id === 'US' ? 'USA/Global' : REGIONS[id].label);

/** Gold outline "Donate" button, as in the sikhri.org header. */
export function DonateButton({ onClick, className = '' }) {
  return (
    <button type="button" className={`sd-donate-btn ${className}`} onClick={onClick} data-gtm="donate-cta">
      Donate
    </button>
  );
}

/** "USA/Global · Canada · UK" pills. */
export function RegionPills({ region, onPick, variant = 'panel' }) {
  return (
    <div className={`sd-pills sd-pills--${variant}`} role="group" aria-label="Where are you donating from?">
      {REGION_IDS.map((id) => (
        <UnstyledButton key={id} className="sd-pill" aria-pressed={region === id} onClick={() => onPick(id)}>
          {shortLabel(id)}
        </UnstyledButton>
      ))}
    </div>
  );
}

/** Mobile-only bar pinned to the bottom of the page: pick a region to open the popup. */
export function MobileDonateBar({ region, onPick, hidden }) {
  if (hidden) return null;
  return (
    <div className="sd-mbar">
      <p>Where Are You Donating From?</p>
      <RegionPills region={region} onPick={onPick} variant="bar" />
    </div>
  );
}

/**
 * The donation popup: a floating panel on the right on desktop, full screen on phones.
 * Kept mounted while closed so a donor who closes it doesn't lose their progress.
 */
export function DonatePopup({ opened, onClose, region, onRegion, showRegions, children }) {
  const phone = useMediaQuery('(max-width: 600px)', false, { getInitialValueInEffect: false });

  return (
    <Drawer.Root
      opened={opened}
      onClose={onClose}
      position="right"
      size={phone ? '100%' : 480}
      offset={phone ? 0 : 16}
      radius={phone ? 0 : 16}
      keepMounted
      returnFocus
      transitionProps={{ transition: phone ? 'slide-up' : 'slide-left', duration: 220 }}
      classNames={{ content: 'sd-pop', body: 'sd-pop-body', header: 'sd-pop-head' }}
      aria-label="Donate to SikhRI"
    >
      <Drawer.Overlay backgroundOpacity={0.45} blur={1} />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.CloseButton className="sd-pop-close" aria-label="Close donation form" />
          {showRegions && (
            <>
              <p className="sd-pop-q">Where are you donating from?</p>
              <RegionPills region={region} onPick={onRegion} />
            </>
          )}
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
