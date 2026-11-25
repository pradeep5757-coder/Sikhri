import { useEffect, useState } from 'react';
import { Loader } from '@mantine/core';
import { useDonation } from './hooks/useDonation';
import { useSettings } from './hooks/useSettings';
import { paypalEnabled } from './lib/region';
import { rememberedFirstName, stripePromiseFor } from './lib/stripe';
import { confirmDonation } from './services/api';
import { pushDonationSuccess } from './lib/attribution';
import { Logo, RegionPicker } from './components/Header';
import { DonationFlow } from './steps/DonationFlow';
import { ThankYou } from './components/ThankYou';
import './styles/stripe.css';

const PAYPAL = paypalEnabled();

/** Stripe sends donors back with ?payment_intent=... after PayPal / bank / 3-D Secure pages. */
function readReturn() {
  const q = new URLSearchParams(window.location.search);
  const pi = q.get('payment_intent');
  return pi ? { paymentIntentId: pi, region: (q.get('region') || 'US').toUpperCase(), redirectStatus: q.get('redirect_status') } : null;
}

export default function App() {
  const { d, set } = useDonation();
  const { settings, error: settingsError } = useSettings();
  const [done, setDone] = useState(null); // { status, firstName }
  const [returning, setReturning] = useState(readReturn);
  const [returnError, setReturnError] = useState('');

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

  return (
    <main className="sd">
      <header className="sd-head">
        <Logo />
        {!done && !returning && <RegionPicker d={d} set={set} />}
      </header>
      {returning ? (
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
  );
}
