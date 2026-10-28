// GST tax invoice for a paid order, as a PDF.
// Prices on the site include 18% GST, so the invoice works backwards from the amount paid to the
// taxable value. Supply within Uttar Pradesh (the seller's state) shows CGST + SGST; any other state
// shows IGST. Uses PDFKit's built-in Helvetica, which has no ₹ glyph, so amounts read "Rs.".
import PDFDocument from "pdfkit";
import { findProduct, LAUNCH } from "../src/data/catalog.js";
import { CONTACT } from "../src/data/legal.js";
import { stateCode } from "../src/data/states.js";

const INK = "#0B1219";
const GOLD = "#9A7136";
const MUTED = "#5B6470";
const LINE = "#D9D4C7";

const money = (n) => `Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
const istDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// Rupees in words using the Indian system (lakh, crore), e.g. "Seventy One Thousand Nine Hundred Ninety Eight".
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]} ${ONES[r % 10]}`.trim();
  return [h ? `${ONES[h]} Hundred` : "", rest].filter(Boolean).join(" ");
}
export function rupeesInWords(amount) {
  let n = Math.round(amount);
  if (n === 0) return "Zero Rupees Only";
  const parts = [];
  for (const [size, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]]) {
    if (n >= size) {
      parts.push(`${below1000(Math.floor(n / size))} ${name}`);
      n %= size;
    }
  }
  if (n) parts.push(below1000(n));
  return `${parts.join(" ")} Rupees Only`;
}

/** Splits the GST inside a paid order by place of supply. */
export function taxBreakdown(order) {
  const total = order.total ?? order.subtotal;
  const gst = order.gst ?? 0;
  const intraState = order.customer?.state === CONTACT.state;
  const cgst = intraState ? Math.round((gst / 2) * 100) / 100 : 0;
  return {
    total,
    taxable: total - gst,
    gst,
    intraState,
    cgst,
    sgst: intraState ? gst - cgst : 0,
    igst: intraState ? 0 : gst,
    ratePct: LAUNCH.gstRate * 100,
  };
}

/** Builds the invoice PDF for a paid order and resolves with its bytes. */
export function invoicePdf(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Tax invoice ${order.invoice.number}`, Author: CONTACT.company } });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const L = doc.page.margins.left;
    const R = doc.page.width - doc.page.margins.right;
    const W = R - L;
    const tax = taxBreakdown(order);
    const c = order.customer;
    const supplyState = c.state ? `${c.state} (${stateCode(c.state)})` : "Not recorded";

    // ---------- Header ----------
    doc.font("Times-Roman").fontSize(26).fillColor(INK).text("RUBIIK", L, 48, { characterSpacing: 6 });
    doc.font("Helvetica").fontSize(8).fillColor(GOLD).text("PRECISION IN EVERY DIMENSION", L, 80, { characterSpacing: 2 });
    doc.font("Helvetica-Bold").fontSize(16).fillColor(INK).text("TAX INVOICE", L, 52, { width: W, align: "right" });
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text("Original for recipient", L, 72, { width: W, align: "right" });
    doc.moveTo(L, 100).lineTo(R, 100).lineWidth(1).strokeColor(GOLD).stroke();

    // ---------- Seller and invoice details ----------
    const col2 = L + W * 0.56;
    let y = 114;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD).text("SOLD BY", L, y);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(CONTACT.company, L, y + 14, { width: W * 0.52 });
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    doc.text(CONTACT.address.join("\n"), { width: W * 0.52, lineGap: 1.5 });
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").text(`GSTIN: ${CONTACT.gstin}`);
    doc.font("Helvetica").text(`State: ${CONTACT.state} (${stateCode(CONTACT.state)})`);
    doc.text(`Email: ${CONTACT.email}`);
    const sellerBottom = doc.y;

    const meta = [
      ["Invoice no.", order.invoice.number],
      ["Invoice date", istDate(order.invoice.date)],
      ["Order no.", order._id],
      ["Payment ref.", order.payment?.reference ?? "-"],
      ["Place of supply", supplyState],
    ];
    meta.forEach(([k, v], i) => {
      const yy = y + 14 + i * 15;
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(k, col2, yy, { width: 80 });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text(v, col2 + 82, yy, { width: R - col2 - 82, align: "right" });
    });
    y = Math.max(sellerBottom, y + 14 + meta.length * 15) + 16;

    // ---------- Buyer ----------
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).strokeColor(LINE).stroke();
    y += 12;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD).text("BILL TO / SHIP TO", L, y);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(c.name, L, y + 14);
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    doc.text([c.address, `${c.city}${c.state ? `, ${c.state}` : ""} ${c.pincode}`, "India"].join("\n"), { width: W * 0.6, lineGap: 1.5 });
    doc.text(`${c.email}  ·  ${c.phone}`);
    y = doc.y + 18;

    // ---------- Items ----------
    const cols = [
      { key: "n", label: "#", x: L, w: 18 },
      { key: "desc", label: "Description", x: L + 18, w: W - 18 - 48 - 30 - 92 - 92 },
      { key: "hsn", label: "HSN", x: 0, w: 48 },
      { key: "qty", label: "Qty", x: 0, w: 30, align: "right" },
      { key: "rate", label: "Rate (incl. GST)", x: 0, w: 92, align: "right" },
      { key: "amt", label: "Amount", x: 0, w: 92, align: "right" },
    ];
    for (let i = 2; i < cols.length; i++) cols[i].x = cols[i - 1].x + cols[i - 1].w;

    doc.rect(L, y, W, 22).fill(INK);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#F9F9F9");
    cols.forEach((col) => doc.text(col.label.toUpperCase(), col.x + 4, y + 7, { width: col.w - 8, align: col.align ?? "left", characterSpacing: 0.5 }));
    y += 22;

    order.items.forEach((line, i) => {
      const product = findProduct(line.slug);
      const serials = (order.certificates ?? []).filter((cert) => cert.slug === line.slug).map((cert) => cert.serial);
      const details = [
        product ? `${product.finish} · MRP ${money(product.price)}` : "",
        line.unitPrice < (product?.price ?? line.unitPrice) ? "Pre-booking privilege applied" : "",
        serials.length ? `Serial${serials.length > 1 ? "s" : ""}: ${serials.join(", ")}` : "",
      ].filter(Boolean);
      const top = y + 8;
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(line.name, cols[1].x + 4, top, { width: cols[1].w - 8 });
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(details.join("\n"), { width: cols[1].w - 8, lineGap: 1 });
      const bottom = doc.y;
      doc.font("Helvetica").fontSize(9).fillColor(INK);
      doc.text(String(i + 1), cols[0].x + 4, top, { width: cols[0].w - 8 });
      doc.text(product?.hsn ?? "9102", cols[2].x + 4, top, { width: cols[2].w - 8 });
      doc.text(String(line.qty), cols[3].x + 4, top, { width: cols[3].w - 8, align: "right" });
      doc.text(money(line.unitPrice), cols[4].x + 4, top, { width: cols[4].w - 8, align: "right" });
      doc.text(money(line.unitPrice * line.qty), cols[5].x + 4, top, { width: cols[5].w - 8, align: "right" });
      y = bottom + 8;
      doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).strokeColor(LINE).stroke();
    });

    // ---------- Totals ----------
    y += 10;
    const labelX = L + W * 0.5;
    const row = (label, value, { bold = false, color = INK } = {}) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10.5 : 9).fillColor(color);
      doc.text(label, labelX, y, { width: W * 0.3 });
      doc.text(value, labelX + W * 0.3, y, { width: W * 0.2, align: "right" });
      y += bold ? 18 : 15;
    };
    row("Items total (incl. GST)", money(order.subtotal));
    if (order.coupon?.discount) row(`Coupon ${order.coupon.code}`, `- ${money(order.coupon.discount)}`, { color: GOLD });
    row("Taxable value", money(tax.taxable));
    if (tax.intraState) {
      row(`CGST @ ${tax.ratePct / 2}%`, money(tax.cgst));
      row(`SGST @ ${tax.ratePct / 2}%`, money(tax.sgst));
    } else {
      row(`IGST @ ${tax.ratePct}%`, money(tax.igst));
    }
    doc.moveTo(labelX, y).lineTo(R, y).lineWidth(1).strokeColor(GOLD).stroke();
    y += 8;
    row("Total paid", money(tax.total), { bold: true });
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(`Amount in words: ${rupeesInWords(tax.total)}`, L, y + 2, { width: W });
    y = doc.y + 18;

    // ---------- HSN tax summary ----------
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(GOLD).text("TAX SUMMARY", L, y);
    y += 14;
    const taxCols = tax.intraState
      ? ["HSN", "Taxable value", `CGST ${tax.ratePct / 2}%`, `SGST ${tax.ratePct / 2}%`, "Total tax"]
      : ["HSN", "Taxable value", `IGST ${tax.ratePct}%`, "Total tax"];
    const taxVals = tax.intraState
      ? ["9102", money(tax.taxable), money(tax.cgst), money(tax.sgst), money(tax.gst)]
      : ["9102", money(tax.taxable), money(tax.igst), money(tax.gst)];
    const cw = W / taxCols.length;
    doc.rect(L, y, W, 18).fill("#F1EEE6");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(INK);
    taxCols.forEach((t, i) => doc.text(t, L + i * cw + 4, y + 5, { width: cw - 8, align: i ? "right" : "left" }));
    y += 18;
    doc.font("Helvetica").fontSize(8.5);
    taxVals.forEach((t, i) => doc.text(t, L + i * cw + 4, y + 5, { width: cw - 8, align: i ? "right" : "left" }));
    y += 22;
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).strokeColor(LINE).stroke();

    // ---------- Footer ----------
    y += 16;
    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    doc.text(
      [
        "Prices are maximum retail prices inclusive of GST. Tax is not payable on reverse charge.",
        `Each watch is part of the RUBIIK ONE limited edition of ${LAUNCH.editionSize} numbered pieces; its certificate of edition is in your RUBIIK account.`,
        "This is a computer-generated invoice and does not require a signature.",
      ].join("\n"),
      L,
      y,
      { width: W, lineGap: 2 },
    );
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(`For ${CONTACT.company}`, L, doc.y + 14, { width: W, align: "right" });
    doc.end();
  });
}
