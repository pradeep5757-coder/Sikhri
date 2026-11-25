import { Checkbox } from '@mantine/core';
import { frequencyPhrase } from '../config/constants';
import { formatMoney, totalToPay } from '../lib/money';
import { CHECK_CLASSES } from './GiftAid';
import { LockIcon } from './Icons';
import { PrimaryButton } from './PrimaryButton';

export function OptIn({ d, set }) {
  return (
    <Checkbox
      className="sd-check sd-optin"
      classNames={CHECK_CLASSES}
      color="gold"
      checked={d.optIn}
      onChange={(e) => set({ optIn: e.currentTarget.checked })}
      label="Yes, I would like to receive educational resources, event updates, and occasional newsletters from the Sikh Research Institute. You can unsubscribe at any time."
    />
  );
}

export function SubmitBar({ d, loading, error, label }) {
  return (
    <>
      <PrimaryButton loading={loading}>
        {label || (
          <>
            Complete payment · {formatMoney(d, totalToPay(d))}
            {d.frequency !== 'one_time' ? ` ${frequencyPhrase(d.frequency)}` : ''}
          </>
        )}
      </PrimaryButton>
      {error && (
        <p className="sd-error" role="alert">
          {error}
        </p>
      )}
      <p className="sd-secure">
        <LockIcon />
        Secure payment by Stripe
      </p>
    </>
  );
}
