// Contact details shown in the footer and on the Privacy Policy and Terms of Service pages.
// TEST VALUES: replace every field below with RUBIIK's real details before going live.
export const CONTACT = {
  email: "care@rubiik.com",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  address: ["RUBIIK Studio", "12 Example Lane, Bandra West", "Mumbai, Maharashtra 400050", "India"],
  hours: "Monday – Saturday, 10:00 – 19:00 IST",
  instagram: "rubiik.watches",
};

export const LEGAL = {
  brand: "RUBIIK",
  updated: "25 October 2026",
  contactEmail: CONTACT.email,
};

/** "+91 98765 43210" → "+919876543210", for tel: and WhatsApp links. */
export const dialable = (number) => number.replace(/[^\d+]/g, "");
