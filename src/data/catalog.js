// Single source of truth for products, pricing and launch dates.
// Imported by both the React app and the Express API, so keep it dependency-free.

export const LAUNCH = {
  // All times are India Standard Time. Pre-booking is live; the watches launch on 6 November.
  prebookOpens: "2026-10-24T00:00:00+05:30",
  launch: "2026-11-06T00:00:00+05:30",
  // The launch falls on Dhanteras; the hero wears its festive touch until the end of 7 November.
  festiveUntil: "2026-11-08T00:00:00+05:30",
  prebookDiscount: 0.2,
  // Prices below are before GST; 18% GST is added at checkout.
  gstRate: 0.18,
  currency: "INR",
  // One numbered edition shared by both models: 200 pieces in total.
  editionSize: 200,
};

export const PRODUCTS = [
  {
    slug: "rubiik-one-automatic",
    code: "AS", // used in serial numbers, e.g. RBK-AS-017-7F3C
    name: "RUBIIK ONE",
    edition: "Automatic Skeleton",
    finish: "Sandblasted Gunmetal",
    tagline: "Style goes deeper.",
    blurb:
      "An open-worked automatic calibre framed by a sculpted, sandblasted gunmetal case. The skeletal dial unveils a deeper perspective — complexity made beautiful.",
    price: 46000, // before 18% GST
    accent: "#8d9094",
    images: {
      cutout: "/images/skeleton-watch.webp",
      lineart: "/images/skeleton-lineart.webp",
      caseback: "/images/skeleton-caseback.webp",
      gallery: [
        "/images/skeleton-closeup.webp",
        "/images/skeleton-cuff.webp",
        "/images/skeleton-underwater.webp",
        "/images/skeleton-compass.webp",
        "/images/skeleton-bw-wrist.webp",
      ],
    },
    specs: [
      ["Movement", "Automatic, self-winding"],
      ["Dial", "Skeleton open-work, blue seconds hand"],
      ["Case", "Architectural octagonal, stainless steel"],
      ["Finish", "Sandblasted gunmetal"],
      ["Crown", "Engraved RUBIIK double-I"],
      ["Caseback", "Exhibition window"],
      ["Bracelet", "Integrated stainless steel links"],
      ["Water resistance", "5 ATM"],
    ],
  },
  {
    slug: "rubiik-one-quartz",
    code: "QO",
    name: "RUBIIK ONE",
    edition: "Quartz Olive",
    finish: "Brushed Olive",
    tagline: "A distinctive perspective on time.",
    blurb:
      "A sunray olive dial with rose-gold indices, set in a brushed olive octagonal case. Precise Japanese quartz in a silhouette that speaks without saying too much.",
    price: 35000, // before 18% GST
    accent: "#8a9a3a",
    images: {
      cutout: "/images/olive-watch.webp",
      lineart: "/images/olive-lineart.webp",
      caseback: "/images/olive-caseback.webp",
      gallery: [
        "/images/olive-closeup.webp",
        "/images/olive-silk.webp",
        "/images/olive-driftwood.webp",
        "/images/olive-voyage.webp",
        "/images/olive-wrist-dark.webp",
      ],
    },
    specs: [
      ["Movement", "Japanese quartz"],
      ["Dial", "Olive sunray, rose-gold indices"],
      ["Case", "Architectural octagonal, stainless steel"],
      ["Finish", "Brushed olive"],
      ["Crown", "Hexagonal, engraved double-I"],
      ["Caseback", "Engraved stainless steel"],
      ["Bracelet", "Integrated stainless steel links"],
      ["Water resistance", "5 ATM"],
    ],
  },
];

export const findProduct = (slug) => PRODUCTS.find((p) => p.slug === slug);

/** Which sales window we are in at a given moment. */
export function phaseAt(now = Date.now(), forceOpen = false) {
  const opens = Date.parse(LAUNCH.prebookOpens);
  const launch = Date.parse(LAUNCH.launch);
  if (forceOpen && now < launch) return "prebook";
  if (now < opens) return "teaser";
  if (now < launch) return "prebook";
  return "launched";
}

/** True while the hero shows the Dhanteras launch theme. */
export const isFestive = (now = Date.now()) => now < Date.parse(LAUNCH.festiveUntil);

/** Unit price before GST for a phase; pre-booking gets the launch discount. */
export function unitPrice(product, phase) {
  return phase === "prebook" ? Math.round(product.price * (1 - LAUNCH.prebookDiscount)) : product.price;
}

/** GST on an amount (rounded to the rupee). */
export const gstOn = (amount) => Math.round(amount * LAUNCH.gstRate);
/** Shown next to every pre-tax price, e.g. "₹46,000 + 18% GST". */
export const GST_LABEL = `+ ${Math.round(LAUNCH.gstRate * 100)}% GST`;

/**
 * Totals for lines of { unit, list, qty } (unit = price charged before GST, list = full price before GST).
 * GST applies to the discounted value, as the tax is charged on what the customer actually pays.
 */
export function totalsFor(lines) {
  const listTotal = lines.reduce((n, l) => n + l.list * l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.unit * l.qty, 0);
  const gst = gstOn(subtotal);
  return { listTotal, discount: listTotal - subtotal, subtotal, gst, total: subtotal + gst };
}

/** A launch date as Indian readers write it, e.g. "6 November" or, with { year: "numeric" }, "6 November 2026". */
export const formatDate = (iso, opts = {}) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", ...opts, timeZone: "Asia/Kolkata" });

export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
