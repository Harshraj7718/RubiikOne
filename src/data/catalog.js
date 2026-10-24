// Single source of truth for products, pricing and launch dates.
// Imported by both the React app and the Express API, so keep it dependency-free.

export const LAUNCH = {
  // All times are India Standard Time.
  prebookOpens: "2026-11-06T00:00:00+05:30",
  launch: "2026-12-25T00:00:00+05:30",
  prebookDiscount: 0.2,
  currency: "INR",
  // One numbered edition shared by both models: 200 pieces in total.
  editionSize: 200,
};

export const PRODUCTS = [
  {
    slug: "rubiik-one-automatic",
    name: "RUBIIK ONE",
    edition: "Automatic Skeleton",
    finish: "Sandblasted Gunmetal",
    tagline: "Style goes deeper.",
    blurb:
      "An open-worked automatic calibre framed by a sculpted, sandblasted gunmetal case. The skeletal dial unveils a deeper perspective — complexity made beautiful.",
    price: 30000,
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
    name: "RUBIIK ONE",
    edition: "Quartz Olive",
    finish: "Brushed Olive",
    tagline: "A distinctive perspective on time.",
    blurb:
      "A sunray olive dial with rose-gold indices, set in a brushed olive octagonal case. Precise Japanese quartz in a silhouette that speaks without saying too much.",
    price: 30000,
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

/** Unit price for a phase; pre-booking gets the launch discount. */
export function unitPrice(product, phase) {
  return phase === "prebook" ? Math.round(product.price * (1 - LAUNCH.prebookDiscount)) : product.price;
}

export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
