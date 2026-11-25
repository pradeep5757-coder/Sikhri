import { useEffect, useRef, useState } from 'react';
import { Title } from '@mantine/core';
import { REGIONS, frequencyPhrase } from '../config/constants';
import { formatAmount } from '../lib/money';
import { focusAndReveal, focusFirstInvalid } from '../lib/focus';
import { isEmpty, validateGift, validateGiftAid } from '../lib/validation';
import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { AmountPicker, Extras, FrequencyControl, FundSelect } from '../components/GiftFields';
import { GiftAidFields } from '../components/GiftAid';
import { PayWith, Summary } from '../components/Summary';
import { LastStep } from '../components/LastStep';

const NO_ERRORS = {};

/** Moves focus to the step heading whenever the step changes (not on first render). */
function useStepHeading(step) {
  const ref = useRef(null);
  const last = useRef(step);
  useEffect(() => {
    if (last.current !== step) {
      last.current = step;
      focusAndReveal(ref.current);
    }
  }, [step]);
  return ref;
}

const StepTitle = ({ headingRef, children }) => (
  <Title order={2} ref={headingRef} tabIndex={-1} className="sd-h2">
    {children}
  </Title>
);

/**
 * Steps: gift → giftaid (UK only) → summary → last → onDone(status) → thank-you.
 * Payment runs through Stripe (Payment Element / Express Checkout); the server records it in Zoho.
 */
export function DonationFlow({ d, set, paypal, stripePromise, onDone }) {
  const [step, setStep] = useState('gift');
  const [showErrors, setShowErrors] = useState(false);
  const [walletError, setWalletError] = useState('');
  const headingRef = useStepHeading(step);

  const ukGiftAid = REGIONS[d.region].giftAid;
  const giftErrors = validateGift(d);
  const giftAidErrors = validateGiftAid(d);

  const go = (next) => {
    setShowErrors(false);
    setWalletError('');
    setStep(next);
  };

  const submitStep = (errors, next) => (e) => {
    e.preventDefault();
    if (isEmpty(errors)) return go(next);
    setShowErrors(true);
    focusFirstInvalid(e.currentTarget);
  };

  const current = step === 'giftaid' && !ukGiftAid ? 'summary' : step;

  if (current === 'gift') {
    return (
      <form noValidate onSubmit={submitStep(giftErrors, ukGiftAid ? 'giftaid' : 'summary')}>
        <FrequencyControl d={d} set={set} />
        <AmountPicker d={d} set={set} error={showErrors ? giftErrors.amount : undefined} />
        <FundSelect d={d} set={set} />
        <Extras d={d} set={set} errors={showErrors ? giftErrors : NO_ERRORS} />
        <PrimaryButton>
          Donate {d.amount >= 1 ? formatAmount(d) : ''}
          {d.frequency !== 'one_time' ? ` ${frequencyPhrase(d.frequency)}` : ''}
        </PrimaryButton>
      </form>
    );
  }

  if (current === 'giftaid') {
    return (
      <form noValidate onSubmit={submitStep(giftAidErrors, 'summary')}>
        <BackButton onClick={() => go('gift')} />
        <StepTitle headingRef={headingRef}>Increase your impact for free</StepTitle>
        <GiftAidFields d={d} set={set} errors={showErrors ? giftAidErrors : NO_ERRORS} />
        <PrimaryButton>Continue</PrimaryButton>
      </form>
    );
  }

  if (current === 'summary') {
    return (
      <div>
        <BackButton onClick={() => go(ukGiftAid ? 'giftaid' : 'gift')} />
        <StepTitle headingRef={headingRef}>Your donation</StepTitle>
        <Summary d={d} set={set} />
        <h2 className="sd-h2">Express checkout</h2>
        <PayWith
          d={d}
          set={set}
          paypal={paypal}
          stripePromise={stripePromise}
          onWalletDone={onDone}
          onError={setWalletError}
          onPick={(method) => {
            set({ method });
            go('last');
          }}
        />
        {walletError && (
          <p className="sd-error" role="alert">
            {walletError}
          </p>
        )}
      </div>
    );
  }

  return <LastStep d={d} set={set} stripePromise={stripePromise} headingRef={headingRef} onBack={() => go('summary')} onDone={onDone} />;
}
