const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmpty = (errors) => Object.keys(errors).length === 0;

/** Step 1 — gift. */
export function validateGift(d) {
  const e = {};
  if (!(d.amount >= 1)) e.amount = 'Choose an amount, or enter one of at least 1.';
  if (d.extrasOpen && d.dedicationOn) {
    if (!d.dedication.name.trim()) e.dedName = 'Enter the name this gift is dedicated to.';
    if (d.dedication.email.trim() && !EMAIL.test(d.dedication.email.trim())) e.dedEmail = 'Check this email address.';
  }
  return e;
}

/** Step 2 — Gift Aid (UK only). */
export function validateGiftAid(d) {
  const e = {};
  const g = d.giftAid;
  if (!g.personal) e.personal = 'Choose yes or no.';
  else if (g.personal === 'yes') {
    if (!g.want) e.want = 'Choose yes or no.';
    else if (g.want === 'yes' && !g.agreed) e.agreed = 'Tick the box to add Gift Aid, or choose No above.';
  }
  return e;
}

/** Final step — donor information. */
export function validateDonor(d) {
  const e = {};
  if (d.institution.on) {
    if (!d.institution.type) e.instType = 'Choose the institution type.';
    if (!d.institution.name.trim()) e.instName = 'Enter the institution name.';
  }
  if (!d.firstName.trim()) e.firstName = 'Enter your first name.';
  if (!d.lastName.trim()) e.lastName = 'Enter your last name.';
  if (!d.email.trim()) e.email = 'Enter your email.';
  else if (!EMAIL.test(d.email.trim())) e.email = 'Check this email address.';
  if (d.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter your phone number.';
  if (!d.address.line1.trim()) e.line1 = 'Enter your street address.';
  if (!d.address.city.trim()) e.city = 'Enter your city.';
  if (!d.address.postal.trim()) e.postal = 'Enter your postal or ZIP code.';
  if (!d.address.country) e.country = 'Choose your country.';
  return e;
}
