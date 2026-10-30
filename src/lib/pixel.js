// Meta Pixel events for the store. The base code (and the first PageView) is added to <head> at build
// time by vite.config.js when VITE_META_PIXEL_ID is set; without it, window.fbq doesn't exist and
// every call here does nothing.
import { findProduct, unitPrice } from "../data/catalog.js";

const fbq = (...args) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq(...args);
};

/** Standard event; `eventID` lets Meta de-duplicate it if the same purchase is reported twice. */
const track = (event, data, eventID) => fbq("track", event, data, eventID ? { eventID } : undefined);

// The site is a single page app: the base code counts the first page; this counts each page after.
let firstView = true;
export function pageView(pathname) {
  if (firstView) return void (firstView = false);
  if (pathname.startsWith("/admin")) return; // the dashboard isn't part of the shop
  track("PageView");
}

const contents = (lines) => lines.map((l) => ({ id: l.slug, quantity: l.qty, item_price: l.unit ?? l.unitPrice }));

export function viewContent(product, phase) {
  track("ViewContent", { content_ids: [product.slug], content_name: `${product.name} ${product.edition}`, content_type: "product", value: unitPrice(product, phase), currency: "INR" });
}

export function addToCart(slug, qty, phase) {
  const product = findProduct(slug);
  if (product) track("AddToCart", { content_ids: [slug], content_name: `${product.name} ${product.edition}`, content_type: "product", contents: [{ id: slug, quantity: qty }], value: unitPrice(product, phase) * qty, currency: "INR" });
}

export function initiateCheckout(lines, total) {
  track("InitiateCheckout", { content_ids: lines.map((l) => l.slug), contents: contents(lines), num_items: lines.reduce((n, l) => n + l.qty, 0), value: total, currency: "INR" });
}

/** Sent once the payment is verified; value is the amount actually paid (incl. GST, after discounts). */
export function purchase(order) {
  track(
    "Purchase",
    { content_ids: order.items.map((i) => i.slug), contents: contents(order.items), content_type: "product", num_items: order.items.reduce((n, i) => n + i.qty, 0), value: order.total, currency: "INR" },
    order.id,
  );
}
