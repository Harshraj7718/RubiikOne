# RUBIIK — RUBIIK ONE limited edition store

Motion-led luxury storefront for the two RUBIIK ONE watches (Automatic Skeleton, Quartz Olive).
React 18 + Vite, Tailwind CSS, Framer Motion, Lenis smooth scroll, and a Node/Express API.

## Run it

```bash
npm install
npm run dev        # site on http://localhost:5173, API on :8787 — uses the real launch dates
npm run dev:open   # same, but forces pre-booking open so you can test the checkout today
```

Production: `npm run build` then `npm start` (Express serves `dist/` and the API on `API_PORT`, default 8787).

## Edition rules (edit in `src/data/catalog.js`)

| Setting | Value |
| --- | --- |
| Pieces | 200 in total, shared by both models (`LAUNCH.editionSize`) |
| Price | ₹30,000 each |
| Pre-booking | opens 6 Nov 2026, 00:00 IST — 20% off (₹24,000) |
| Launch | 25 Dec 2026, 00:00 IST (Christmas) |
| Limit | 2 per model per order |

Phases are decided by the server: **teaser** (before 6 Nov: countdown + "Notify me" waitlist),
**prebook** (6 Nov – 24 Dec: discounted reservations), **launched** (full price).
Prices and stock are always recomputed on the server; each reserved piece gets the next number in the shared edition (e.g. 017/200), whichever model it is.

## Where things live

- `src/sections/` — home page sections (Hero, Manifesto, Meaning, Vision, Collection, Gallery, Details, Experience, Limited, PreBook, Finale)
- `src/pages/` — product detail and checkout/confirmation
- `src/components/motion.jsx` — split-text reveals, scroll-scrubbed words, parallax, magnetic and tilt hovers
- `server/` — API (`/api/status`, `/api/waitlist`, `/api/prebook`); orders and waitlist are stored in `server/data/db.json`
- `brand-source/` — original brand images; `npm run images` regenerates the cut-outs and section crops in `public/images/`

## Before going live

- Payment is not collected: reservations are recorded and the concierge follows up. Add a gateway (e.g. Razorpay) in `/api/prebook`.
- Replace the JSON file store with a database, and add order/waitlist email notifications.
