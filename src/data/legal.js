// Contact details shown in the footer and on the Privacy Policy and Terms of Service pages.
export const CONTACT = {
  company: "BookLynk Services Private Limited",
  email: "support@rubiikone.com",
  address: ["Plot No. A4, Logix Technova", "B-320, Sector 132, Noida", "Gautam Buddha Nagar, Uttar Pradesh 201304", "India"],
  // TEST VALUES: replace these with RUBIIK's real phone, WhatsApp, hours and Instagram before going live.
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  hours: "Monday – Saturday, 10:00 – 19:00 IST",
  instagram: "rubiik.watches",
};

export const LEGAL = {
  brand: "RUBIIK",
  company: CONTACT.company,
  updated: "25 October 2026",
  contactEmail: CONTACT.email,
};

/** "+91 98765 43210" → "+919876543210", for tel: and WhatsApp links. */
export const dialable = (number) => number.replace(/[^\d+]/g, "");
