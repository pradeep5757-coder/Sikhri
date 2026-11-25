import { REGIONS, GIFT_AID_RATE } from '../config/constants';

const round2 = (n) => Math.round(n * 100) / 100;

/** $50 / $12.50 / £1,000 — optionally suffixed with the currency code. */
export function formatMoney(d, value, withCode = false) {
  const r = REGIONS[d.region];
  const num = Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${r.symbol}${num}${withCode ? ` ${r.currency}` : ''}`;
}

export const formatAmount = (d, withCode = false) => formatMoney(d, d.amount, withCode);
export const feeAmount = (d) => (d.amount >= 1 ? round2((d.amount * d.feePercent) / 100) : 0);
export const totalToPay = (d) => round2(d.amount + feeAmount(d));
export const giftAidAmount = (d) => round2(d.amount * GIFT_AID_RATE);
export const hasGiftAid = (d) =>
  REGIONS[d.region].giftAid && d.giftAid.personal === 'yes' && d.giftAid.want === 'yes' && d.giftAid.agreed;
