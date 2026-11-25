# SikhRI Donation Form — React + Mantine

A plain JavaScript (JSX) copy of the live donation page at
https://go.skyrocketdigital.com/sikhri-donation-form/, built with **React 19**, **Mantine 9** and **Vite**.
It has the same logo, colours, steps, validation and behaviour, with real Stripe payments and a Zoho CRM standalone function call, served by Vercel API functions.

## Requirements

- Node.js 20 or newer
- npm

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the dist/ build locally
```

`vite.config.js` uses `base: './'`, so `dist/` works from any sub-folder (for example `/sikhri-donation-form/`).

## URL flags

| Flag | Effect |
|---|---|
| `?region=US` / `CA` / `UK` / `GB` | Start in that region. Without it, the region is guessed from the browser time zone (Canadian zones → CA, London → UK, everything else → US). |
| `?paypal=1` | Show the PayPal option. |
| `?share=menu` / `row` | Force the thank-you share layout. By default, touch devices with `navigator.share` get `menu`, everything else gets `row`. |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | Read from the URL, stored in Stripe metadata and sent to Zoho. |

## Folder structure

```
index.html                  page shell (title, favicon, noindex)
public/favicon.png
src/
  main.jsx                  MantineProvider + global CSS
  App.jsx                   header (logo, region) + flow / thank you
  theme.js                  Mantine theme (gold palette, Avenir, radius, CSS vars)
  styles/donation.css       visual layer copied 1:1 from the live page
  assets/sikhri-logo.png
  config/constants.js       regions, frequencies, amount presets, funds, fee, Gift Aid, share text
  lib/
    region.js               region detection, ?paypal, ?share
    money.js                formatting, fee, total, Gift Aid maths
    validation.js           per-step validation rules
    countries.js            localised country list
    addressLookup.js        SAMPLE address provider (replace later)
    focus.js                focus/scroll helpers for accessibility
  hooks/useDonation.js      single form state + region/frequency side effects
  components/               Header, FloatingField, SegmentedRadio, GiftFields, GiftAid,
                            Summary (+ PayWith), DonorFields, Payment, ThankYou, Icons, ...
  steps/DonationFlow.jsx    step machine and submit handling
  lib/stripe.js             Stripe.js loader, Elements options, appearance
  hooks/useSettings.js      loads publishable keys from /api/settings
  components/LastStep.jsx   donor details + Stripe Payment Element (card / bank / PayPal)
  components/ExpressCheckout.jsx   Apple Pay / Google Pay
  services/api.js           calls the Vercel API
api/                        Vercel serverless functions (Node.js) — the backend
  settings.js, create-payment.js, confirm-donation.js, stripe-webhook.js
  _lib/                     config, Stripe client, validation, Zoho call, CRM sync
server/
  zoho-standalone-function.deluge   Deluge function for Zoho CRM
scripts/generate-cert.js    local HTTPS certificate (mkcert)
```

## Step flow

1. **Gift** — how often (one time / monthly), amount presets or other amount, fund, optional comment or dedication.
2. **Gift Aid** — UK only: personal money? → want Gift Aid? → declaration checkbox. Adds 25%.
3. **Your donation** — subtotal, Gift Aid lines (if any), "Cover fees" slider (0–15%, default 5%), total; then express checkout (Apple Pay, Google Pay) or Card / Bank account (US, CA) / PayPal (`?paypal=1`).
4. **Your information** — institution (optional), name, email, phone, country, address search or manual address, payment placeholder, newsletter opt-in, "Complete payment".
5. **Thank you** — confirmation and share buttons.

Changing region restarts at step 1, resets Gift Aid answers and the newsletter default, and moves the default country.

## Backend (Vercel API, Node.js)

The PHP backend is no longer used. Everything runs in this Vercel project:

| Endpoint | What it does |
|---|---|
| `GET /api/settings` | Stripe publishable key per region + funds |
| `POST /api/create-payment` | Validates the form, recalculates fee/total, finds or creates the Stripe Customer, creates a PaymentIntent (one time) or Subscription (monthly) and returns the client secret |
| `POST /api/confirm-donation` | Re-checks the payment with Stripe after the browser confirms it; if paid, sends it to the Zoho standalone function (once — marked on the PaymentIntent) |
| `POST /api/stripe-webhook?region=US\|CA\|UK` | Safety net + lifecycle: payments that clear later (bank), monthly renewals, refunds, disputes, failures, cancellations |

Payment methods: Card, Apple Pay / Google Pay (Stripe Express Checkout), US bank (ACH), Canadian pre-authorised debit (ACSS), PayPal (`?paypal=1`, must be enabled in the Stripe dashboard).

### Environment variables (Vercel > Settings > Environment Variables)
See `.env.example`. `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are already set (test keys). Add:
- `ZOHO_CRM_FUNCTION_URL` – the standalone function REST URL (until set, the CRM call is skipped and the payload is logged in Vercel runtime logs).
- `STRIPE_WEBHOOK_SECRET` – after creating the webhook endpoint below.

Redeploy after changing environment variables.

### Stripe webhook
Stripe Dashboard > Developers > Webhooks > Add endpoint:
`https://sikhri-donation-form.vercel.app/api/stripe-webhook?region=US` with events
`payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `customer.subscription.deleted`.
Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. (All three regions share one Stripe account today, so one endpoint is enough.)

### Zoho CRM
In use: the existing standalone function **Stripe_sandbox** (crm.zoho.com, argument `crmAPIRequest`). After each successful payment the API POSTs it a Stripe-style `payment_intent.succeeded` event (PaymentIntent + donation metadata); the function creates/updates the Contact and Donation and fetches Stripe fees. URL is stored in the Vercel env `ZOHO_CRM_FUNCTION_URL`. Refund/dispute/cancel events are logged only until the function handles them.

Alternative (not in use): `server/zoho-standalone-function.deluge` – create it as a Standalone function with one argument `donation_data`, enable REST API (API key) and put the URL in `ZOHO_CRM_FUNCTION_URL`. It upserts the Contact and a Donations record keyed by `Stripe_Payment_Intent_Id`, and handles refund / dispute / failure / cancellation updates. Module and field API names are placeholders.

### Testing
Stripe test cards: `4242 4242 4242 4242`, any future date, any CVC. 3-D Secure: `4000 0027 6000 3184`. US bank: choose a test institution in the bank pop-up.

### Webflow (later)
Build with `VITE_API_BASE=https://sikhri-donation-form.vercel.app npm run build` and embed the built JS/CSS in Webflow; the API already allows `*.webflow.io` and sikhri.org (add others with `ALLOWED_ORIGINS`).
