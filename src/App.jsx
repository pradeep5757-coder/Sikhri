import { useCallback, useEffect, useState } from 'react';
import { Loader } from '@mantine/core';
import { useDonation } from './hooks/useDonation';
import { useSettings } from './hooks/useSettings';
import { paypalEnabled } from './lib/region';
import { rememberedFirstName, stripePromiseFor } from './lib/stripe';
import { confirmDonation } from './services/api';
import { pushDonationSuccess } from './lib/attribution';
import { REGIONS } from './config/constants';
import { Logo } from './components/Header';
import { DonateButton, DonatePopup, MobileDonateBar } from './components/DonatePopup';
import { DonationFlow } from './steps/DonationFlow';
import { ThankYou } from './components/ThankYou';
import { DemoPage } from './components/DemoPage';
import './styles/stripe.css';
import './styles/popup.css';

const PAYPAL = paypalEnabled();

/** Stripe sends donors back with ?payment_intent=... after PayPal / bank / 3-D Secure pages. */
function readReturn() {
  const q = new URLSearchParams(window.location.search);
  const pi = q.get('payment_intent');
  return pi ? { paymentIntentId: pi, region: (q.get('region') || 'US').toUpperCase(), redirectStatus: q.get('redirect_status') } : null;
}

/** ?donate=1 or #donate opens the popup on load (handy for links from emails and other pages). */
const wantsOpen = () => new URLSearchParams(window.location.search).has('donate') || window.location.hash === '#donate';

/**
 * Props let the Webflow embed reuse the app without the demo page:
 *  - demo: render the sample sikhri.org-style page around the button (default true)
 *  - mobileBar: show the "Where are you donating from?" bar on phones (default true)
 */
export default function App({ demo = true, mobileBar = true }) {
  const { d, set, reset } = useDonation();
  const { settings, error: settingsError } = useSettings();
  const [done, setDone] = useState(null); // { status, firstName }
  const [returning, setReturning] = useState(readReturn);
  const [returnError, setReturnError] = useState('');
  const [opened, setOpened] = useState(() => Boolean(readReturn()) || wantsOpen());
  const [formKey, setFormKey] = useState(0);

  const open = useCallback(
    (region) => {
      if (region && REGIONS[region] && !done) set({ region });
      setOpened(true);
    },
    [set, done],
  );

  const close = () => {
    setOpened(false);
    // After a finished donation, the next open starts a fresh form.
    if (done) {
      setTimeout(() => {
        reset();
        setDone(null);
        setFormKey((k) => k + 1);
      }, 250);
    }
  };

  // Any element on the host page can open the popup: data-sikhri-donate, href="#donate",
  // or window.SikhriDonate.open('US' | 'CA' | 'UK').
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest?.('[data-sikhri-donate], a[href$="#donate"]');
      if (!el) return;
      e.preventDefault();
      open(el.getAttribute('data-sikhri-donate')?.toUpperCase() || undefined);
    };
    document.addEventListener('click', onClick);
    window.SikhriDonate = { open, close: () => setOpened(false) };
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  useEffect(() => {
    if (!returning) return;
    const clean = () => window.history.replaceState({}, '', `${window.location.pathname}?region=${returning.region}`);
    confirmDonation(returning.region, returning.paymentIntentId)
      .then((r) => finish(r))
      .catch((err) => setReturnError(err.message))
      .finally(() => {
        clean();
        setReturning(null);
      });
  }, [returning]);

  function finish(result) {
    pushDonationSuccess(result);
    setDone({ status: result.status, firstName: result.firstName || rememberedFirstName() || d.firstName });
  }

  const stripePromise = stripePromiseFor(settings?.regions?.[d.region]?.publishableKey);
  const busy = Boolean(returning);

  return (
    <>
      {demo && <DemoPage donateButton={<DonateButton onClick={() => open()} />} />}
      {!demo && <DonateButton onClick={() => open()} />}

      {mobileBar && <MobileDonateBar region={d.region} onPick={open} hidden={opened} />}

      <DonatePopup
        opened={opened}
        onClose={close}
        region={d.region}
        onRegion={(region) => set({ region })}
        showRegions={!done && !busy}
      >
        <main className="sd" key={formKey}>
          <header className="sd-head">
            <Logo />
            {!done && !busy && <p className="sd-pop-sub">Donate in {REGIONS[d.region].label}</p>}
          </header>
          {busy ? (
            <div className="sd-thanks">
              <Loader color="gold" />
              <p>Confirming your donation…</p>
            </div>
          ) : done ? (
            <ThankYou d={d} status={done.status} firstName={done.firstName} />
          ) : (
            <>
              {returnError && (
                <p className="sd-error" role="alert">
                  {returnError}
                </p>
              )}
              {settingsError && (
                <p className="sd-error" role="alert">
                  Secure payment could not be loaded ({settingsError}).
                </p>
              )}
              <DonationFlow key={d.region} d={d} set={set} paypal={PAYPAL} stripePromise={stripePromise} onDone={finish} />
            </>
          )}
        </main>
      </DonatePopup>
    </>
  );
}
