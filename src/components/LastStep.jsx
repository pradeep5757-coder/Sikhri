import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Title } from '@mantine/core';
import { createPayment, confirmDonation } from '../services/api';
import { billingDetails, deferredOptions, methodTypes, appearance, rememberDonor, returnUrl } from '../lib/stripe';
import { focusFirstInvalid } from '../lib/focus';
import { isEmpty, validateDonor } from '../lib/validation';
import { BackButton } from './BackButton';
import { DonorFields, InstitutionFields } from './DonorFields';
import { OptIn, SubmitBar } from './Payment';

const NO_ERRORS = {};
const PE_OPTIONS = {
  layout: 'tabs',
  fields: { billingDetails: { name: 'never', email: 'never', phone: 'never', address: 'never' } },
  wallets: { applePay: 'never', googlePay: 'never', link: 'never' }, // Link adds its own Bank/Klarna tabs; keep the box to the chosen method
};

const methodTitle = (m) => (m === 'bank' ? 'Bank account' : m === 'paypal' ? 'PayPal' : 'Card information');

/** Shared top half of the last step: back, heading, institution + donor fields. */
function InfoSection({ d, set, errors, headingRef, onBack, locked }) {
  return (
    <>
      <BackButton onClick={onBack} />
      <Title order={2} ref={headingRef} tabIndex={-1} className="sd-h2">
        Your information
      </Title>
      <fieldset className="sd-lock" disabled={locked}>
        <InstitutionFields d={d} set={set} errors={errors} />
        <DonorFields d={d} set={set} errors={errors} />
      </fieldset>
      <h2 className="sd-h2">{methodTitle(d.method)}</h2>
    </>
  );
}

/** Card, US bank (ACH) and PayPal: payment details are collected before the payment is created. */
function DeferredForm({ d, set, headingRef, onBack, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errors = validateDonor(d);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!isEmpty(errors)) {
      setShowErrors(true);
      focusFirstInvalid(e.currentTarget);
      return;
    }
    if (!stripe || !elements) return setError('Secure payment is still loading. Please try again in a moment.');

    setBusy(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw submitError;
      const intent = await createPayment(d, d.method);
      rememberDonor(d);
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: intent.clientSecret,
        confirmParams: { return_url: returnUrl(d), payment_method_data: { billing_details: billingDetails(d) } },
        redirect: 'if_required',
      });
      if (confirmError) throw confirmError;
      const result = await confirmDonation(d.region, paymentIntent?.id || intent.paymentIntentId);
      onDone(result);
    } catch (err) {
      setError(err.message || 'The payment could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={submit}>
      <InfoSection d={d} set={set} errors={showErrors ? errors : NO_ERRORS} headingRef={headingRef} onBack={onBack} />
      <div className="sd-stripe">
        <PaymentElement options={PE_OPTIONS} onLoadError={(e) => setError(e.error?.message || 'This payment method is not available right now.')} />
      </div>
      <OptIn d={d} set={set} />
      <SubmitBar d={d} loading={busy} error={error} />
    </form>
  );
}

/** Canadian pre-authorised debit: Stripe needs the payment created first, then the bank is connected. */
function AcssForm({ d, set, stripePromise, headingRef, onBack, onDone }) {
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [intent, setIntent] = useState(null);
  const errors = validateDonor(d);

  const start = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!isEmpty(errors)) {
      setShowErrors(true);
      focusFirstInvalid(e.currentTarget);
      return;
    }
    setBusy(true);
    try {
      setIntent(await createPayment(d, 'bank'));
      rememberDonor(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!intent) {
    return (
      <form noValidate onSubmit={start}>
        <InfoSection d={d} set={set} errors={showErrors ? errors : NO_ERRORS} headingRef={headingRef} onBack={onBack} />
        <p className="sd-hint">You'll connect your bank securely with Stripe in the next step.</p>
        <OptIn d={d} set={set} />
        <SubmitBar d={d} loading={busy} error={error} label="Continue to bank details" />
      </form>
    );
  }

  return (
    <div>
      <InfoSection d={d} set={set} errors={NO_ERRORS} headingRef={headingRef} onBack={onBack} locked />
      <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret, appearance }}>
        <AcssConfirm d={d} onDone={onDone} />
      </Elements>
    </div>
  );
}

function AcssConfirm({ d, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError('');
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl(d), payment_method_data: { billing_details: billingDetails(d) } },
        redirect: 'if_required',
      });
      if (confirmError) throw confirmError;
      const result = await confirmDonation(d.region, paymentIntent.id);
      onDone(result);
    } catch (err) {
      setError(err.message || 'The payment could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={confirm}>
      <div className="sd-stripe">
        <PaymentElement options={PE_OPTIONS} onLoadError={(e) => setError(e.error?.message || 'This payment method is not available right now.')} />
      </div>
      <SubmitBar d={d} loading={busy} error={error} />
    </form>
  );
}

export function LastStep({ d, set, stripePromise, headingRef, onBack, onDone }) {
  if (!stripePromise) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <p className="sd-error" role="alert">
          Secure payment is unavailable right now. Please try again later.
        </p>
      </div>
    );
  }
  const types = methodTypes(d.region, d.method);
  const props = { d, set, headingRef, onBack, onDone };
  if (types[0] === 'acss_debit') return <AcssForm {...props} stripePromise={stripePromise} />;
  return (
    <Elements stripe={stripePromise} options={deferredOptions(d, types)}>
      <DeferredForm {...props} />
    </Elements>
  );
}
