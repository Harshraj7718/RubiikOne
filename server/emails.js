// Customer emails: order confirmation (with the receipt voucher), dispatch (with the tax invoice),
// password reset and the launch announcement. Table-based HTML with inline styles, which is what
// email clients render reliably, plus a plain-text version of each.
import { formatDate, formatINR, LAUNCH } from "../src/data/catalog.js";
import { CONTACT } from "../src/data/legal.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const firstName = (name) => String(name ?? "").trim().split(/\s+/)[0] || "there";
const delivery = () => formatDate(LAUNCH.deliveryFrom, { year: "numeric" });

/** Wraps body rows in the RUBIIK email frame: navy header, ivory card, small footer. */
function frame({ preheader, heading, body, cta }) {
  const button = cta
    ? `<tr><td style="padding:28px 0 4px"><a href="${esc(cta.href)}" style="display:inline-block;background:#C9A464;color:#0B1219;text-decoration:none;font:600 13px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;padding:15px 26px">${esc(cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(heading)}</title></head>
<body style="margin:0;background:#EEF0F3">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF0F3"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">
    <tr><td style="background:#0B1219;padding:26px 32px">
      <div style="font:400 26px/1 Georgia,'Times New Roman',serif;letter-spacing:8px;color:#F9F9F9">RUB<span style="color:#C9A464">II</span>K</div>
      <div style="font:400 10px/1.6 Arial,sans-serif;letter-spacing:3px;color:#C9A464;margin-top:8px">PRECISION IN EVERY DIMENSION</div>
    </td></tr>
    <tr><td style="background:#FFFFFF;padding:34px 32px 30px;border-bottom:3px solid #A50003">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font:400 28px/1.2 Georgia,'Times New Roman',serif;color:#0B1219;padding-bottom:16px">${esc(heading)}</td></tr>
        ${body}
        ${button}
      </table>
    </td></tr>
    <tr><td style="padding:18px 8px;font:400 11px/1.6 Arial,sans-serif;color:#6B7480;text-align:center">
      RUBIIK is a product of ${esc(CONTACT.company)}<br>${esc(CONTACT.address.join(", "))}<br>
      GSTIN ${esc(CONTACT.gstin)} · <a href="mailto:${esc(CONTACT.email)}" style="color:#6B7480">${esc(CONTACT.email)}</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const p = (html) => `<tr><td style="font:400 15px/1.65 Arial,sans-serif;color:#2B333D;padding-bottom:12px">${html}</td></tr>`;
const line = (label, value, strong = false) =>
  `<tr><td style="padding:7px 0;border-bottom:1px solid #ECE8DF;font:${strong ? 600 : 400} 14px/1.4 Arial,sans-serif;color:#2B333D">${esc(label)}</td><td align="right" style="padding:7px 0;border-bottom:1px solid #ECE8DF;font:${strong ? 600 : 400} 14px/1.4 Arial,sans-serif;color:#0B1219;white-space:nowrap">${esc(value)}</td></tr>`;
const table = (rows) => `<tr><td style="padding:6px 0 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>`;

/** After payment: certificates, amounts, delivery date; the receipt voucher is attached. */
export function orderConfirmationEmail(order, { siteUrl }) {
  const pieces = order.certificates.map((c) => line(`${c.model} · No. ${String(c.number).padStart(3, "0")}`, c.serial)).join("");
  const money = [
    line("MRP", formatINR(order.compareAt)),
    order.compareAt > order.subtotal ? line("Pre-booking privilege", `− ${formatINR(order.compareAt - order.subtotal)}`) : "",
    order.coupon?.discount ? line(`Coupon ${order.coupon.code}`, `− ${formatINR(order.coupon.discount)}`) : "",
    line("Paid (incl. GST)", formatINR(order.total), true),
  ].join("");
  const subject = `Your RUBIIK ONE is reserved · Order ${order._id}`;
  const html = frame({
    preheader: `Payment received. Your certificate of edition is ready; delivery from ${delivery()}.`,
    heading: `Welcome, ${firstName(order.customer.name)}.`,
    body: [
      p(`Your payment is received and your ${order.certificates.length > 1 ? "pieces are" : "piece is"} now part of the RUBIIK ONE limited edition, numbered within ${LAUNCH.editionPerModel} of each model.`),
      table(pieces),
      table(money),
      p(`<b>Delivery begins from ${esc(delivery())}</b>, with complimentary insured shipping to ${esc(order.customer.city)}. We'll email you when your watch is dispatched, with your tax invoice.`),
      p(`Your receipt voucher <b>${esc(order.receipt?.number)}</b> is attached. Your certificates and documents are always in your account.`),
    ].join(""),
    cta: { label: "View my collection", href: `${siteUrl}/account` },
  });
  const text = [
    `Welcome, ${firstName(order.customer.name)}.`,
    `Payment received for order ${order._id}.`,
    ...order.certificates.map((c) => `${c.model} · No. ${String(c.number).padStart(3, "0")} · ${c.serial}`),
    `Paid (incl. GST): ${formatINR(order.total)}`,
    `Delivery begins from ${delivery()}. We'll email you on dispatch with your tax invoice.`,
    `Receipt voucher ${order.receipt?.number} is attached.`,
    `Your account: ${siteUrl}/account`,
  ].join("\n");
  return { subject, html, text };
}

/** On dispatch: courier and tracking; the tax invoice is attached. */
export function dispatchEmail(order, { siteUrl }) {
  const d = order.dispatch ?? {};
  const subject = `Your RUBIIK ONE is on its way · Order ${order._id}`;
  const html = frame({
    preheader: `Dispatched${d.tracking ? ` · tracking ${d.tracking}` : ""}. Your tax invoice is attached.`,
    heading: "It's on its way.",
    body: [
      p(`${esc(firstName(order.customer.name))}, your RUBIIK ONE has left our studio and is travelling to ${esc(order.customer.city)}, fully insured.`),
      table([d.courier ? line("Courier", d.courier) : "", d.tracking ? line("Tracking number", d.tracking, true) : "", line("Order", order._id)].join("")),
      p(`Your tax invoice <b>${esc(order.invoice?.number)}</b> is attached. Someone may need to sign for the parcel.`),
    ].join(""),
    cta: { label: "View my documents", href: `${siteUrl}/account` },
  });
  const text = [`Your RUBIIK ONE is on its way (order ${order._id}).`, d.courier && `Courier: ${d.courier}`, d.tracking && `Tracking: ${d.tracking}`, `Tax invoice ${order.invoice?.number} is attached.`, `${siteUrl}/account`]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

/** A one-time link to choose a new password. */
export function passwordResetEmail(name, link) {
  const subject = "Reset your RUBIIK password";
  const html = frame({
    preheader: "Use this link within 30 minutes to choose a new password.",
    heading: "Choose a new password",
    body: [
      p(`Hello ${esc(firstName(name))}, we received a request to reset the password for your RUBIIK account.`),
      p("The button below works once and expires in 30 minutes. If you didn't ask for this, you can ignore this email; your password stays the same."),
    ].join(""),
    cta: { label: "Reset password", href: link },
  });
  const text = `Hello ${firstName(name)},\n\nReset your RUBIIK password (link works once, for 30 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`;
  return { subject, html, text };
}

/** Launch announcement for the waitlist and pre-order owners. */
export function launchEmail({ name, owner }, { siteUrl }) {
  const subject = owner ? "RUBIIK ONE has launched — your piece is part of it" : "RUBIIK ONE is here";
  const html = frame({
    preheader: `Launched on ${formatDate(LAUNCH.launch, { year: "numeric" })}. ${LAUNCH.editionPerModel} numbered pieces of each model, never repeated.`,
    heading: owner ? "The edition is complete in name." : "RUBIIK ONE is here.",
    body: owner
      ? [p(`${esc(firstName(name))}, RUBIIK ONE launched today, and your numbered piece is part of it.`), p(`Deliveries begin from <b>${esc(delivery())}</b>. We'll write again when yours is dispatched.`)].join("")
      : [
          p(`RUBIIK ONE launched on ${esc(formatDate(LAUNCH.launch, { year: "numeric" }))}: an Automatic Skeleton and a Quartz Olive, each in a numbered edition of ${LAUNCH.editionPerModel} pieces.`),
          p("The remaining pieces are available now, while they last."),
        ].join(""),
    cta: { label: owner ? "View my collection" : "Discover RUBIIK ONE", href: owner ? `${siteUrl}/account` : `${siteUrl}/#collection` },
  });
  const text = owner
    ? `RUBIIK ONE launched today and your numbered piece is part of it. Deliveries begin from ${delivery()}. ${siteUrl}/account`
    : `RUBIIK ONE is here: ${LAUNCH.editionPerModel} numbered pieces of each model, never repeated. ${siteUrl}/#collection`;
  return { subject, html, text };
}
