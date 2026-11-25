// All business constants for the donation form, mirrored from the live page.

export const REGIONS = {
  US: { id: 'US', label: 'USA / Global', currency: 'USD', symbol: '$', country: 'US', bankNote: 'ACH Direct Debit', bank: true, giftAid: false, optIn: true },
  CA: { id: 'CA', label: 'Canada', currency: 'CAD', symbol: '$', country: 'CA', bankNote: 'Pre-authorized debit', bank: true, giftAid: false, optIn: false },
  UK: { id: 'UK', label: 'UK', currency: 'GBP', symbol: '£', country: 'GB', bankNote: '', bank: false, giftAid: true, optIn: false },
};

export const FREQUENCIES = [
  { id: 'one_time', label: 'One time', phrase: 'one time' },
  { id: 'monthly', label: 'Monthly', phrase: 'monthly' },
];

export const AMOUNT_PRESETS = {
  one_time: { amounts: [50, 100, 250, 500], start: 250 },
  monthly: { amounts: [25, 50, 100, 250], start: 50 },
};

export const FUNDS = [
  { value: 'Unrestricted', label: 'Unrestricted Fund' },
  { value: 'Sidak Leadership Program for Young Adults', label: 'Sidak Leadership Program for Young Adults' },
  { value: 'The Guru Granth Sahib Project for Seekers', label: 'The Guru Granth Sahib Project for Seekers' },
];

export const MAX_TEXT = 250; // comment / dedication message length
export const FEE = { startPercent: 5, maxPercent: 15 };
export const GIFT_AID_RATE = 0.25;
export const GIFT_AID_CHARITY = 'SikhRI UK';
export const INSTITUTION_TYPES = ['Corporation', 'Foundation', 'Place of Worship', 'Government', 'Other'];

export const SHARE = {
  url: 'https://sikhri.org/donate',
  title: 'Donate | Sikh Research Institute (SikhRI)',
  line: 'I just donated to the Sikh Research Institute to support Sikh research and education. Join me:',
  subject: 'I just supported the Sikh Research Institute',
};

export const presetsFor = (frequency) => AMOUNT_PRESETS[frequency];
export const frequencyPhrase = (id) => FREQUENCIES.find((f) => f.id === id)?.phrase ?? '';
