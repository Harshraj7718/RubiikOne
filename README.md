# RUBIIK — RUBIIK ONE limited edition store

Motion-led luxury storefront for the two RUBIIK ONE watches (Automatic Skeleton, Quartz Olive).
React 18 + Vite, Tailwind CSS, Framer Motion, Lenis smooth scroll, and a Node/Express API.

## Run it

```bash
npm install
cp .env.example .env   # then put your MongoDB connection string in .env
npm run dev        # site on http://localhost:5173, API on :8787 — uses the real launch dates
npm run dev:open   # same, but forces pre-booking open so you can test the checkout today
```

The scripts load `.env` automatically (`node --env-file-if-exists=.env`). `.env` is git-ignored; never commit it.

## Deploying on Vercel

The site deploys from GitHub. Vercel serves the built pages and images from its CDN; every `/api/*` request runs the
same Express app as a serverless function (`api/index.js` → `server/app.js`). `vercel.json` routes `/api/*` to the
function and every other path (`/admin`, `/account`, `/watch/...`) to the app.

1. **Environment variables** (Vercel → Project → Settings → Environment Variables, for Production):
   `MONGODB_URI`, `MONGODB_DB` (`rubiik`), `ADMIN_USERNAME`, `ADMIN_PASSWORD`; later `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
   Redeploy after adding or changing them.
2. **MongoDB Atlas → Network Access**: Vercel has no fixed IP addresses, so allow `0.0.0.0/0` and rely on a strong
   database password.
3. Push to `main`; Vercel builds and deploys. The dashboard is at `https://<your-domain>/admin`.

## Performance

- **Images**: `npm run images` writes each large photo at full size plus 768px and 1152px versions, all encoded from the
  originals at the same quality (`src/data/images.json` lists them). Pages use `responsive()` from `src/lib/img.js`
  so each device downloads the smallest file that still covers the image at full sharpness. Everything below the hero
  loads lazily as visitors scroll.
- **Code**: product, checkout, account and admin pages load on demand; React and the animation library are separate,
  long-cached files.
- **Server** (`npm start`): gzip for text, 1-year caching for fingerprinted build files, 30 days for images.
- The development server (`npm run dev`) is always slower than production; judge speed with `npm run build && npm start`.

## Database (MongoDB)

All data lives in MongoDB: `users`, `sessions` (auto-expire), `orders`, `waitlist` and `meta` (edition counter, serial key).
The server connects at startup and creates the indexes it needs.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Connection string (required) |
| `MONGODB_DB` | Database name on the cluster (default `rubiik`, kept separate from other apps' data) |
| `MONGODB_DNS` | Optional DNS servers for the `mongodb+srv` lookup if the system resolver refuses SRV queries (default fallback `1.1.1.1,8.8.8.8`) |

Reservations and payment confirmations run in transactions that all touch one edition document, so concurrent buyers
can never over-sell a model's edition or receive the same number. In Atlas, allow your server's IP under **Network Access**.

Production: `npm run build` then `npm start` (Express serves `dist/` and the API on `API_PORT`, default 8787).
Set `NODE_ENV=production` there so session cookies are marked `Secure`.

## Edition rules (edit in `src/data/catalog.js`)

| Setting | Value |
| --- | --- |
| Pieces | 200 of each model, 400 in total (`LAUNCH.editionPerModel`); each model is numbered No. 001–200 on its own |
| Price (MRP, incl. GST) | Automatic Skeleton ₹49,999 · Quartz Olive ₹39,999 |
| GST | 18%, included in the price (`LAUNCH.gstRate`); invoices show the GST inside each amount |
| Pre-booking | open now (since 24 Oct 2026) — 20% off: ₹39,999 and ₹31,999 (incl. GST) |
| Launch | 6 Nov 2026, 00:00 IST |
| Delivery | from 25 Dec 2026 (`LAUNCH.deliveryFrom`), shown after payment, in the account, on the invoice and in the Terms |
| Limit | 2 per model per order |

Phases are decided by the server: **teaser** (before pre-booking opens: countdown + "Notify me" waitlist),
**prebook** (until 5 Nov: discounted pre-orders), **launched** (from 6 Nov, full price).
Orders store `subtotal` and `total` (equal, GST-inclusive) and `gst` (the tax inside); the customer is charged `total`.
Prices and stock are always recomputed on the server.

## Pre-order flow

1. **Sign in** — customers create an account or sign in before pre-ordering (passwords hashed with scrypt; sessions in an httpOnly cookie).
2. **Details** — delivery address, plus an opt-in to appear on the Founding Owners wall under a display name they choose.
3. **Payment** — the order holds its pieces for 30 minutes while payment completes.
4. **Certificate of Edition** — once payment is verified, each watch gets the next number in the shared edition and a serial such as `RBK-AS-017-7F3C` (model code, number, keyed check code). Customers see their certificates on `/account`.

5. **GST documents and email** — when payment is verified the order gets a **receipt voucher** for the advance (`RV/26-27/0001`, …) and the customer is emailed a confirmation with it attached. When the admin marks the order **dispatched** (courier and tracking), a **tax invoice** is issued (`RBK/26-27/0001`, …) and emailed. Both PDFs are in **/account → Orders & documents** and in the admin order details. Documents show the seller (`src/data/legal.js`), HSN 9102, serials, and CGST + SGST for buyers in Uttar Pradesh or IGST elsewhere. Built with PDFKit (`server/invoice.js`); emails in `server/emails.js`, sent by `server/mailer.js`.
6. **Password reset** — "Forgot password?" on the sign-in form emails a one-time link (`/reset-password#…`, valid 30 minutes); saving a new password signs out every other session.
7. **Launch email** — admin → Waitlist → "Send launch email" announces the launch to every owner and waitlist address, once each, in batches.

The **Founding Owners wall** (right after the hero) shows certificates of owners who opted in, with only their chosen display name.

### Payments

| Environment variable | Purpose |
| --- | --- |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Enables real Razorpay Checkout; every payment is verified by its signature |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Sends email from support@rubiikone.com; without them emails are printed to the server log |
| `SITE_URL` | The public address used in email links (e.g. `https://rubiikone.com`) |
| `SERIAL_SECRET` | Key for serial check codes (optional; otherwise one is generated and kept in the data file) |

Without the Razorpay keys the store runs in **test mode**: the payment step is clearly labelled and simulates a successful payment, so no money is ever charged.

## Admin dashboard (`/admin`)

The dashboard has its own sign-in, separate from customer accounts. `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
(and in Vercel's Environment Variables) are the **built-in owner**. Owners add team members under **Team**, each with their
own username and password, as **owner** (also manages the team and reads the activity log) or **staff** (everything
else). Deactivating someone or resetting their password signs them out at once. **Activity** lists every sign-in
(including failed ones), change, export and document opened, with who, when and from which IP. A successful sign-in gets a
12-hour httpOnly session; failed attempts are limited to 5 per 15 minutes; every `/api/admin/*` route checks the session
on the server. To change the password, edit the variable and restart (or redeploy on Vercel).

| Page | What it does |
| --- | --- |
| Overview | Pieces sold / held / available, revenue, customers, waitlist, sales per model, last 14 days, recent orders |
| Orders | Search and filter, full order details with certificates, CSV export |
| Customers | Accounts with orders, pieces, spend and serials |
| Coupons | Create discount codes (percentage or fixed ₹, optional usage limit and expiry), pause or delete them, see uses and discount given |
| Waitlist | "Notify me" emails, CSV export |
| Team · Activity · My account | Team members and roles (owners), the activity log (owners), your own password |
| Owners wall | Show or hide each paid order's card, edit its display name |
| Media library | Every image the site uses (with the files that use it) and the original brand files (admin-only) |
| Design system | Live colour palette, typography, logo, ornaments, buttons and the certificate card |

## Where things live

- `src/sections/` — home page sections (in page order: Hero, Owners, Manifesto, Collection, Meaning, Vision, Gallery, Blueprint, Details, Experience, Limited, PreBook, Finale)
- `src/pages/` — product detail, checkout (sign in → details → payment → certificate) and account
- `src/pages/Privacy.jsx`, `src/pages/Terms.jsx` — Privacy Policy (`/privacy`) and Terms of Service (`/terms`); the contact email and date are in `src/data/legal.js`
- `src/components/Certificate.jsx` — the owner's certificate card
- `src/components/motion.jsx` — split-text reveals, scroll-scrubbed words, parallax, magnetic and tilt hovers
- `server/` — API: `index.js` (status, waitlist, pre-orders, verification, owners wall), `auth.js` (accounts and sessions), `payments.js` (Razorpay / test mode), `db.js` (MongoDB connection and indexes)
- `brand-source/` — original brand images; `npm run images` regenerates the cut-outs and section crops in `public/images/`

## Before going live

- Add your Razorpay keys (see above) and test a real payment end to end.
- Add order/waitlist email notifications.
- Add a password-reset flow (accounts currently have sign-in and sign-up only).
