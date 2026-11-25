import { useId, useState } from 'react';
import { Button, Slider } from '@mantine/core';
import { FEE, REGIONS, frequencyPhrase } from '../config/constants';
import { feeAmount, formatMoney, giftAidAmount, hasGiftAid, totalToPay } from '../lib/money';
import { ExpressCheckout } from './ExpressCheckout';

export function Summary({ d, set }) {
  const [editing, setEditing] = useState(false);
  const sliderId = useId();
  const withGa = hasGiftAid(d);
  const fee = feeAmount(d);

  return (
    <div className="sd-sums">
      <div className="sd-sum">
        <p>Subtotal{d.frequency !== 'one_time' ? `, ${frequencyPhrase(d.frequency)}` : ''}</p>
        <div className="sd-sum-value">{formatMoney(d, d.amount)}</div>
      </div>

      {withGa && (
        <>
          <div className="sd-sum">
            <p>Gift Aid</p>
            <div className="sd-sum-value">{formatMoney(d, giftAidAmount(d))}</div>
          </div>
          <div className="sd-sum sd-sum--worth">
            <p>Total donation worth</p>
            <div className="sd-sum-value">{formatMoney(d, d.amount + giftAidAmount(d))}</div>
          </div>
        </>
      )}

      <div className="sd-sum">
        <p>Cover fees</p>
        <div className="sd-sum-value">
          <Button className="sd-mini" variant="default" aria-expanded={editing} onClick={() => setEditing(!editing)}>
            {editing ? 'Done' : 'Edit'}
          </Button>
          <span>{formatMoney(d, fee)}</span>
        </div>
      </div>

      {editing && (
        <div className="sd-fee-edit">
          <p className="sd-muted">
            {fee > 0 ? `By adding ${formatMoney(d, fee)}, you help` : 'Adding to your gift helps'} cover the necessary software and processing fees, ensuring your full gift supports our work.
          </p>
          <div className="sd-fee-row">
            <Slider
              id={sliderId}
              className="sd-slider"
              classNames={{ track: 'sd-slider-track', thumb: 'sd-slider-thumb' }}
              color="gold"
              size={6}
              thumbSize={18}
              min={0}
              max={FEE.maxPercent}
              step={1}
              label={null}
              value={d.feePercent}
              onChange={(feePercent) => set({ feePercent })}
              thumbLabel="Cover fees, as a percentage of your donation"
            />
            <output htmlFor={sliderId}>{d.feePercent}%</output>
          </div>
        </div>
      )}

      <div className="sd-sum sd-sum--total">
        <p>Total to pay</p>
        <div className="sd-sum-value">{formatMoney(d, totalToPay(d), true)}</div>
      </div>
    </div>
  );
}

export function PayWith({ d, set, paypal, stripePromise, onPick, onWalletDone, onError }) {
  const r = REGIONS[d.region];
  return (
    <div className="sd-paywith">
      <ExpressCheckout d={d} set={set} stripePromise={stripePromise} onDone={onWalletDone} onError={onError} />
      <SecondaryButton onClick={() => onPick('card')}>Card</SecondaryButton>
      {r.bank && <SecondaryButton onClick={() => onPick('bank')}>Bank account</SecondaryButton>}
      {paypal && <SecondaryButton onClick={() => onPick('paypal')}>PayPal</SecondaryButton>}
    </div>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <Button fullWidth classNames={{ root: 'sd-btn sd-btn--secondary', label: 'sd-btn-label' }} onClick={onClick}>
      {children}
    </Button>
  );
}
