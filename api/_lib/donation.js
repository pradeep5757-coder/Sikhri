import { FEE_MAX_PERCENT, FUNDS, GIFT_AID_RATE, INSTITUTION_TYPES, REGION_IDS } from './config.js';
import { HttpError } from './stripe.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const METHODS = ['card', 'bank', 'paypal', 'apple_pay', 'google_pay'];
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ga_client_id', 'ga_session_id'];

const text = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const round2 = (n) => Math.round(n * 100) / 100;
const bool = (v) => v === true || v === 'true';

/** Validates the browser payload and recalculates every amount on the server. */
export function normalizeDonation(input) {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Invalid request body.');

  const region = text(input.region, 5).toUpperCase();
  if (!REGION_IDS.includes(region)) throw new HttpError(400, 'Invalid donation region.');

  const frequency = text(input.frequency, 20);
  if (!['one_time', 'monthly'].includes(frequency)) throw new HttpError(400, 'Invalid donation frequency.');

  const method = text(input.method, 20);
  if (!METHODS.includes(method)) throw new HttpError(400, 'Invalid payment method.');
  if (method === 'bank' && region === 'UK') throw new HttpError(400, 'Bank payments are not available in the UK.');
  const isWallet = method === 'apple_pay' || method === 'google_pay';

  const amount = round2(Number(input.amount));
  if (!(amount >= 1 && amount <= 1000000)) throw new HttpError(400, 'Please enter a valid donation amount.');

  const feePercent = Math.min(FEE_MAX_PERCENT, Math.max(0, Math.round(Number(input.feePercent) || 0)));
  const feeAmount = round2((amount * feePercent) / 100);
  const totalAmount = round2(amount + feeAmount);

  const fund = text(input.fund, 150);
  if (!FUNDS.includes(fund)) throw new HttpError(400, 'Invalid donation fund.');

  const firstName = text(input.firstName, 100);
  const lastName = text(input.lastName, 100);
  const email = text(input.email, 250).toLowerCase();
  const phone = text(input.phone, 50);
  const a = input.address || {};
  const address = {
    line1: text(a.line1),
    line2: text(a.line2),
    city: text(a.city, 100),
    state: text(a.state, 100),
    postal_code: text(a.postal, 40),
    country: text(a.country, 2).toUpperCase(),
  };

  if (!EMAIL.test(email)) throw new HttpError(400, 'Please enter a valid email.');
  if (!firstName || !lastName) throw new HttpError(400, 'Please enter your first and last name.');
  if (!isWallet) {
    if (phone.replace(/\D/g, '').length < 7) throw new HttpError(400, 'Please enter your phone number.');
    if (!address.line1 || !address.city || !address.postal_code || !address.country) throw new HttpError(400, 'Please complete your address.');
  }

  const ga = input.giftAid || {};
  const giftAid = region === 'UK' && ga.personal === 'yes' && ga.want === 'yes' && bool(ga.agreed);

  const inst = input.institution || {};
  const isInstitution = bool(inst.on);
  const institutionType = isInstitution ? text(inst.type, 50) : '';
  if (isInstitution && (!INSTITUTION_TYPES.includes(institutionType) || !text(inst.name))) {
    throw new HttpError(400, 'Please complete the institution details.');
  }

  const extrasOpen = bool(input.extrasOpen);
  const ded = input.dedication || {};
  const attribution = Object.fromEntries(UTM.map((k) => [k, text(input.attribution?.[k], 200)]));

  return {
    region,
    frequency,
    method,
    isWallet,
    fund,
    amount,
    feePercent,
    feeAmount,
    totalAmount,
    giftAid,
    giftAidAmount: giftAid ? round2(amount * GIFT_AID_RATE) : 0,
    giftAidPersonal: region === 'UK' ? text(ga.personal, 3) : '',
    giftAidWant: region === 'UK' ? text(ga.want, 3) : '',
    comment: extrasOpen && bool(input.commentOn) ? text(input.comment, 250) : '',
    dedicationName: extrasOpen && bool(input.dedicationOn) ? text(ded.name, 150) : '',
    dedicationEmail: extrasOpen && bool(input.dedicationOn) ? text(ded.email, 250) : '',
    dedicationMessage: extrasOpen && bool(input.dedicationOn) ? text(ded.message, 250) : '',
    isInstitution,
    institutionType,
    institutionName: isInstitution ? text(inst.name, 150) : '',
    firstName,
    lastName,
    email,
    phone,
    address,
    optIn: bool(input.optIn),
    pageUrl: text(input.pageUrl, 490),
    attribution,
  };
}

/** Stripe metadata (strings only, <= 50 keys, <= 500 chars each). Same field names the Zoho function reads. */
export function toMetadata(v, currency) {
  const m = {
    source: 'SikhRI Website',
    submitted_at: new Date().toISOString(),
    region: v.region,
    currency: currency.toUpperCase(),
    frequency: v.frequency,
    fund: v.fund,
    amount: v.amount,
    fee_percent: v.feePercent,
    fee_amount: v.feeAmount,
    total_amount: v.totalAmount,
    payment_method: v.method,
    gift_aid: v.giftAid,
    gift_aid_amount: v.giftAidAmount,
    gift_aid_personal: v.giftAidPersonal,
    gift_aid_want: v.giftAidWant,
    comment: v.comment,
    dedication_name: v.dedicationName,
    dedication_email: v.dedicationEmail,
    dedication_message: v.dedicationMessage,
    is_institution: v.isInstitution,
    institution_type: v.institutionType,
    institution_name: v.institutionName,
    first_name: v.firstName,
    last_name: v.lastName,
    email: v.email,
    phone: v.phone,
    address_line1: v.address.line1,
    address_line2: v.address.line2,
    city: v.address.city,
    state: v.address.state,
    postal_code: v.address.postal_code,
    country: v.address.country,
    newsletter_opt_in: v.optIn,
    page_url: v.pageUrl,
    ...v.attribution,
  };
  return Object.fromEntries(Object.entries(m).map(([k, val]) => [k, String(val ?? '').slice(0, 500)]));
}

/** Stripe payment_method_types for the donor's choice. */
export function paymentMethodTypes(region, method) {
  if (method === 'bank') return [region === 'CA' ? 'acss_debit' : 'us_bank_account'];
  if (method === 'paypal') return ['paypal'];
  return ['card']; // card, Apple Pay and Google Pay all settle as card payments
}
