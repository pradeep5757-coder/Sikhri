import { useState } from 'react';
import { Elements, ExpressCheckoutElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { createPayment, confirmDonation } from '../services/api';
import { deferredOptions, rememberDonor, returnUrl } from '../lib/stripe';

const ECE_OPTIONS = {
  buttonType: { applePay: 'donate', googlePay: 'donate' },
  buttonTheme: { applePay: 'black', googlePay: 'black' },
  buttonHeight: 52,
  layout: { maxColumns: 2, maxRows: 1, overflow: 'never' },
  paymentMethods: { applePay: 'auto', googlePay: 'auto', link: 'never', paypal: 'never', amazonPay: 'never', klarna: 'never' },
  emailRequired: true,
  phoneNumberRequired: true,
  billingAddressRequired: true,
};

function splitName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ['', ''];
  if (parts.length === 1) return [parts[0], parts[0]];
  return [parts[0], parts.slice(1).join(' ')];
}

function Wallets({ d, set, onDone, onError, onAvailability }) {
  const stripe = useStripe();
  const elements = useElements();

  const onConfirm = async (event) => {
    onError('');
    const b = event.billingDetails || {};
    const [firstName, lastName] = splitName(b.name);
    const a = b.address || {};
    const donor = {
      ...d,
      firstName,
      lastName,
      email: b.email || '',
      phone: b.phone || '',
      address: { line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', postal: a.postal_code || '', country: a.country || d.address.country },
    };
    const method = event.expressPaymentType === 'apple_pay' ? 'apple_pay' : 'google_pay';
    set({ firstName, lastName, email: donor.email, phone: donor.phone, address: donor.address, method });

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw submitError;
      const intent = await createPayment(donor, method);
      rememberDonor(donor);
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: intent.clientSecret,
        confirmParams: { return_url: returnUrl(donor) },
        redirect: 'if_required',
      });
      if (error) throw error;
      const result = await confirmDonation(d.region, paymentIntent?.id || intent.paymentIntentId);
      onDone(result);
    } catch (err) {
      event.paymentFailed?.({ reason: 'fail' });
      onError(err.message || 'The payment could not be completed. Please try another method.');
    }
  };

  return (
    <ExpressCheckoutElement
      options={ECE_OPTIONS}
      onReady={({ availablePaymentMethods }) => onAvailability(!!availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean))}
      onConfirm={onConfirm}
    />
  );
}

/** Apple Pay / Google Pay buttons (shown only on devices where they are set up). */
export function ExpressCheckout({ d, set, stripePromise, onDone, onError }) {
  const [available, setAvailable] = useState(null); // null = still checking

  if (!stripePromise) return null;
  return (
    <div className="sd-express-wrap" hidden={available === false}>
      <Elements stripe={stripePromise} options={deferredOptions(d, ['card'])}>
        <Wallets d={d} set={set} onDone={onDone} onError={onError} onAvailability={setAvailable} />
      </Elements>
      {available && (
        <div className="sd-or" role="separator">
          <span>Or</span>
        </div>
      )}
    </div>
  );
}
