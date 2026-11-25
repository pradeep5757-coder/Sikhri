import { Checkbox } from '@mantine/core';
import { GIFT_AID_CHARITY } from '../config/constants';
import { formatAmount, formatMoney, giftAidAmount } from '../lib/money';
import { SegmentedRadio, YES_NO } from './SegmentedRadio';

export const CHECK_CLASSES = { body: 'sd-check-body', label: 'sd-check-label', input: 'sd-check-input' };

export function GiftAidFields({ d, set, errors }) {
  const g = d.giftAid;
  const setGa = (patch) => set({ giftAid: { ...g, ...patch } });
  const amount = formatAmount(d);
  const extra = formatMoney(d, giftAidAmount(d));

  return (
    <>
      <div className="sd-ga-figures">
        <div>
          <strong>{amount}</strong>
          <span>Your donation</span>
        </div>
        <div className="is-up">
          <strong>{formatMoney(d, d.amount + giftAidAmount(d))}</strong>
          <span>Your donation with Gift Aid</span>
        </div>
      </div>
      <p>
        With Gift Aid, your {amount} donation would be worth an extra {extra}, at no extra cost to you.
      </p>
      <p className="sd-muted">We'll be able to claim Gift Aid if this is your personal money and does not depend on receiving goods in return.</p>

      <SegmentedRadio name="sd-ga-personal" legend="Is this donation your personal money?" value={g.personal} options={YES_NO} error={errors.personal} onChange={(personal) => setGa({ personal })} />

      {g.personal === 'yes' && (
        <SegmentedRadio
          name="sd-ga-want"
          legend="Do you want to Gift Aid this donation?"
          hint="You must be a UK taxpayer to add Gift Aid to your donation."
          value={g.want}
          options={YES_NO}
          error={errors.want}
          onChange={(want) => setGa({ want })}
        />
      )}

      {g.personal === 'yes' && g.want === 'yes' && (
        <div className="sd-declaration">
          <h3>Gift Aid declaration</h3>
          <Checkbox
            className="sd-check"
            classNames={CHECK_CLASSES}
            color="gold"
            checked={g.agreed}
            error={errors.agreed ? true : undefined}
            aria-invalid={errors.agreed ? true : undefined}
            onChange={(e) => setGa({ agreed: e.currentTarget.checked })}
            label={`Yes, I am a UK taxpayer and would like ${GIFT_AID_CHARITY} to reclaim the tax on all donations I have made in the last four years and for all future donations that I make to be Gift Aid donations, until I notify them otherwise.`}
          />
          {errors.agreed && <p className="sd-error">{errors.agreed}</p>}
          <p>I understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay any difference.</p>
          <p>Please let us know if you want to cancel the declaration, change your name and/or address, or no longer pay sufficient tax on your income and/or capital gains.</p>
        </div>
      )}
    </>
  );
}
