// RUBIIK store API as a reusable Express app: launch status, live stock, accounts, pre-orders with
// payment, owner certificates, the Founding Owners wall and the admin API. Data lives in MongoDB.
// Used by server/index.js (local and `npm start`) and api/index.js (Vercel serverless function).
import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { PRODUCTS, LAUNCH, EDITION_TOTAL, findProduct, phaseAt, unitPrice, totalsFor, formatDate, couponLabel } from "../src/data/catalog.js";
import { connectDb } from "./db.js";
import { stateCode } from "../src/data/states.js";
import { mountAuth } from "./auth.js";
import { mountAdmin, createLimiter } from "./admin.js";
import { PAYMENT_MODE, startPayment, verifyPayment } from "./payments.js";
import { invoicePdf, receiptPdf } from "./invoice.js";
import { trySendMail, MAIL_MODE } from "./mailer.js";
import { orderConfirmationEmail, dispatchEmail } from "./emails.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORCE_PREBOOK = process.argv.includes("--force-prebook") || process.env.FORCE_PREBOOK === "1";
// How long an unpaid pre-order holds its pieces before they return to the edition.
const HOLD_MINUTES = 30;

/**
 * Connects to MongoDB and builds the Express app. Throws if the database can't be reached.
 * `serveClient` also serves the built site from dist/ (for `npm start`; Vercel serves it itself).
 */
export async function createApp({ serveClient = true } = {}) {
  const store = await connectDb();
  const { users, orders, waitlist, meta, coupons, withTransaction } = store;

  const app = express();
  // Express 4 doesn't catch rejected promises from async handlers; send them to the error handler
  // instead of letting a database hiccup crash the process.
  for (const method of ["get", "post", "patch", "delete"]) {
    const register = app[method].bind(app);
    app[method] = (route, ...handlers) =>
      register(
        route,
        ...handlers.map((h) =>
          typeof h === "function" && h.length < 4
            ? (req, res, next) => {
                try {
                  Promise.resolve(h(req, res, next)).catch(next);
                } catch (err) {
                  next(err);
                }
              }
            : h,
        ),
      );
  }
  app.set("trust proxy", 1);
  // gzip text responses (HTML, JS, CSS, JSON). Images are already compressed and are skipped.
  app.use(compression());
  app.use(express.json({ limit: "32kb" }));
  // Absolute links in emails. SITE_URL in production; otherwise the address the request came in on.
  const siteUrl = (req) => (process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");

  const { requireUser } = mountAuth(app, store, { siteUrl });
  mountAdmin(app, store, { root, sendDocument, dispatchOrder, siteUrl });

  const phase = () => phaseAt(Date.now(), FORCE_PREBOOK);
  // Orders that currently claim pieces: paid ones, and unpaid ones whose hold hasn't lapsed.
  const holdingFilter = () => ({ $or: [{ status: "paid" }, { status: "pending_payment", holdUntil: { $gt: new Date() } }] });

  /**
   * Each model has its own edition of LAUNCH.editionPerModel pieces; paid orders and live holds
   * count against their model. Totals across both models are included for the overall figures.
   */
  async function stockView({ session, excludeOrderId } = {}) {
    const match = excludeOrderId ? { $and: [holdingFilter(), { _id: { $ne: excludeOrderId } }] } : holdingFilter();
    const rows = await orders
      .aggregate([{ $match: match }, { $unwind: "$items" }, { $group: { _id: "$items.slug", qty: { $sum: "$items.qty" } } }], { session })
      .toArray();
    const per = LAUNCH.editionPerModel;
    const byModel = Object.fromEntries(
      PRODUCTS.map((p) => {
        const reserved = rows.find((r) => r._id === p.slug)?.qty ?? 0;
        return [p.slug, { total: per, reserved, remaining: Math.max(0, per - reserved) }];
      }),
    );
    const reserved = Object.values(byModel).reduce((n, m) => n + m.reserved, 0);
    return { total: EDITION_TOTAL, reserved, remaining: Math.max(0, EDITION_TOTAL - reserved), byModel };
  }

  /**
   * Per-model numbering replaced one shared counter. The first time it's needed, each model's
   * counter starts from the highest number already issued for that model, so no number repeats.
   */
  async function ensureModelCounters(session) {
    const edition = await meta.findOne({ _id: "edition" }, { session });
    if (edition?.issuedBy) return;
    const rows = await orders
      .aggregate([{ $match: { status: "paid" } }, { $unwind: "$certificates" }, { $group: { _id: "$certificates.slug", max: { $max: "$certificates.number" } } }], { session })
      .toArray();
    const issuedBy = Object.fromEntries(PRODUCTS.map((p) => [p.code, rows.find((r) => r._id === p.slug)?.max ?? 0]));
    await meta.updateOne({ _id: "edition" }, { $set: { issuedBy } }, { session, upsert: true });
  }

  /** Throws a readable 409 if any line asks for more pieces of its model than are left. */
  function checkModelStock(stock, lines, message) {
    for (const line of lines) {
      const left = stock.byModel[line.slug].remaining;
      if (line.qty > left) throw fail(409, message(findProduct(line.slug), left));
    }
  }

  /**
   * Every reservation and payment confirmation writes this one document inside its transaction.
   * Concurrent transactions therefore conflict and are retried one after another, so two buyers
   * can never both take the last piece or receive the same edition number.
   */
  const lockEdition = (session) => meta.updateOne({ _id: "edition" }, { $inc: { version: 1 } }, { upsert: true, session });

  /**
   * GST document numbers run without gaps within each Indian financial year (April–March), from a
   * counter per year in the meta collection: receipt vouchers RV/26-27/0001 (at payment) and tax
   * invoices RBK/26-27/0001 (at dispatch).
   */
  const DOC_PREFIX = { receipt: "RV", invoice: "RBK" };
  async function nextDocNumber(kind, date, session) {
    const ist = new Date(date.getTime() + 5.5 * 3600000);
    const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
    const fy = `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
    const counter = await meta.findOneAndUpdate({ _id: `${kind}:${fy}` }, { $inc: { seq: 1 } }, { upsert: true, session, returnDocument: "after" });
    return `${DOC_PREFIX[kind]}/${fy}/${String(counter.seq).padStart(4, "0")}`;
  }

  /** Secret for serial check codes: SERIAL_SECRET, or one generated once and kept in the database. */
  async function serialSecret() {
    if (process.env.SERIAL_SECRET) return process.env.SERIAL_SECRET;
    await meta.updateOne({ _id: "serialSecret" }, { $setOnInsert: { value: randomBytes(32).toString("hex") } }, { upsert: true });
    return (await meta.findOne({ _id: "serialSecret" })).value;
  }

  /** e.g. RBK-AS-017-7F3C: model code, edition number, and a keyed check code that can't be guessed. */
  const makeSerial = (secret, product, number, orderId) =>
    `RBK-${product.code}-${String(number).padStart(3, "0")}-${createHmac("sha256", secret).update(`${number}|${product.slug}|${orderId}`).digest("hex").slice(0, 4).toUpperCase()}`;

  // What the customer may see about their own order (never other customers' data).
  const orderView = (o) => ({
    id: o._id,
    createdAt: o.createdAt,
    status: o.status,
    holdUntil: o.holdUntil,
    items: o.items,
    subtotal: o.subtotal,
    compareAt: o.compareAt,
    gst: o.gst ?? 0,
    total: o.total ?? o.subtotal,
    coupon: o.coupon ? { code: o.coupon.code, discount: o.coupon.discount } : null,
    receiptNumber: o.receipt?.number ?? null,
    invoiceNumber: o.invoice?.number ?? null,
    dispatch: o.dispatch ? { at: o.dispatch.at, courier: o.dispatch.courier ?? null, tracking: o.dispatch.tracking ?? null } : null,
    customer: { name: o.customer.name, city: o.customer.city },
    wall: o.wall,
    certificates: o.certificates ?? [],
    paidAt: o.payment?.paidAt ?? null,
  });

  const fail = (status, message) => Object.assign(new Error(message), { status });

  /**
   * Looks up an admin-issued coupon and checks it can still be used. Paid orders and live holds
   * count as uses, exactly like pieces of the edition, so a limited coupon can't be over-used.
   * Returns { code, type, value } or throws a 4xx error the customer can read.
   */
  async function usableCoupon(rawCode, { session } = {}) {
    const code = String(rawCode ?? "").trim().toUpperCase();
    // Marked so checkout can tell a coupon problem apart from other order errors.
    const fail = (status, message) => Object.assign(new Error(message), { status, field: "coupon" });
    const coupon = code && (await coupons.findOne({ _id: code }, { session }));
    if (!coupon || !coupon.active) throw fail(404, "This coupon code isn't valid.");
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) throw fail(410, "This coupon has expired.");
    if (coupon.maxUses) {
      const used = await orders.countDocuments({ "coupon.code": code, ...holdingFilter() }, { session });
      if (used >= coupon.maxUses) throw fail(409, "This coupon has already been fully used.");
    }
    return { code, type: coupon.type, value: coupon.value };
  }

  // Customers check a code before paying; guessing codes is slowed down per visitor.
  const limitCouponChecks = createLimiter({ max: 20, windowMs: 15 * 60 * 1000 });
  app.post("/api/coupons/check", async (req, res) => {
    if (!limitCouponChecks(req.ip)) return res.status(429).json({ error: "Too many attempts. Please wait a few minutes and try again." });
    try {
      const coupon = await usableCoupon(req.body?.code);
      res.json({ coupon: { ...coupon, label: couponLabel(coupon) } });
    } catch (err) {
      if (!err.status) console.error(err);
      res.status(err.status ?? 500).json({ error: err.status ? err.message : "Couldn't check this code. Please try again." });
    }
  });

  app.get("/api/status", async (_req, res) => {
    // Public: only whether each model can still be ordered. Exact counts stay in the admin dashboard.
    const stock = await stockView();
    const byModel = Object.fromEntries(Object.entries(stock.byModel).map(([slug, m]) => [slug, { available: m.remaining > 0 }]));
    res.json({ phase: phase(), forced: FORCE_PREBOOK, paymentMode: PAYMENT_MODE, serverTime: new Date().toISOString(), launch: LAUNCH, stock: { byModel } });
  });

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE = /^[+\d][\d\s-]{8,15}$/;

  app.post("/api/waitlist", async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
    await waitlist.updateOne({ email }, { $setOnInsert: { email, at: new Date() } }, { upsert: true });
    res.json({ ok: true });
  });

  // Step 1: a signed-in customer reserves pieces; the order waits for payment.
  app.post("/api/prebook", requireUser, async (req, res) => {
    const current = phase();
    if (current === "teaser") return res.status(409).json({ error: `Pre-booking opens on ${formatDate(LAUNCH.prebookOpens)}.` });

    const { customer = {}, items = [], wall = {}, couponCode = "" } = req.body ?? {};
    const phone = String(customer.phone ?? "").trim();
    const address = String(customer.address ?? "").trim();
    const city = String(customer.city ?? "").trim();
    const state = String(customer.state ?? "").trim();
    const pincode = String(customer.pincode ?? "").trim();
    const showOnWall = wall.show === true;
    const displayName = String(wall.displayName ?? "").trim().slice(0, 40);

    const problems = [];
    if (!PHONE.test(phone)) problems.push("phone");
    if (address.length < 6) problems.push("address");
    if (city.length < 2) problems.push("city");
    if (!stateCode(state)) problems.push("state");
    if (!/^\d{6}$/.test(pincode)) problems.push("pincode");
    if (showOnWall && displayName.length < 2) problems.push("displayName");
    if (problems.length) return res.status(400).json({ error: "Please check the highlighted fields.", fields: problems });

    // Prices are always recomputed here; the client's numbers are never trusted.
    // Merge repeated lines first so the per-model limit can't be split across entries.
    const qtyBySlug = new Map();
    for (const raw of Array.isArray(items) ? items : []) {
      const product = findProduct(raw?.slug);
      if (!product) return res.status(400).json({ error: "That watch is not part of the edition." });
      const qty = Math.floor(Number(raw?.qty));
      if (!(qty >= 1)) return res.status(400).json({ error: "Please choose a valid quantity." });
      qtyBySlug.set(product.slug, (qtyBySlug.get(product.slug) ?? 0) + qty);
    }
    const lines = [];
    for (const [slug, qty] of qtyBySlug) {
      const product = findProduct(slug);
      if (qty > 2) return res.status(400).json({ error: "Each watch is limited to 2 per client." });
      lines.push({ slug, name: `${product.name} ${product.edition}`, qty, unitPrice: unitPrice(product, current) });
    }
    if (!lines.length) return res.status(400).json({ error: "Your selection is empty." });

    try {
      const order = await withTransaction(async (session) => {
        await lockEdition(session);
        const stock = await stockView({ session });
        checkModelStock(stock, lines, (p, left) => (left ? `Only ${left} ${p.edition} ${left === 1 ? "piece remains" : "pieces remain"}.` : `The ${p.edition} edition is fully reserved.`));
        // The coupon is re-checked inside the transaction, so its usage limit holds under concurrent orders.
        const coupon = String(couponCode).trim() ? await usableCoupon(couponCode, { session }) : null;
        const totals = totalsFor(
          lines.map((l) => ({ unit: l.unitPrice, list: findProduct(l.slug).price, qty: l.qty })),
          coupon,
        );
        const doc = {
          _id: `RBK-${randomUUID().slice(0, 8).toUpperCase()}`,
          userId: req.user._id,
          createdAt: new Date(),
          holdUntil: new Date(Date.now() + HOLD_MINUTES * 60000),
          phase: current,
          customer: { name: req.user.name, email: req.user.email, phone, address, city, state, pincode },
          items: lines,
          // All amounts in rupees and GST-inclusive: subtotal is after the pre-booking discount, the
          // coupon comes off that, and total is what is charged; gst is the tax inside the total.
          subtotal: totals.subtotal,
          coupon: coupon ? { ...coupon, discount: totals.couponDiscount } : null,
          compareAt: totals.listTotal,
          gstRate: LAUNCH.gstRate,
          gst: totals.gst,
          total: totals.total,
          wall: { show: showOnWall, displayName: showOnWall ? displayName : null },
          status: "pending_payment",
        };
        await orders.insertOne(doc, { session });
        return doc;
      });
      const payment = await startPayment({ id: order._id, amount: order.total });
      await orders.updateOne({ _id: order._id }, { $set: { payment: { provider: payment.provider, providerOrderId: payment.providerOrderId ?? null } } });
      res.status(201).json({ order: orderView(order), payment: { ...payment, name: req.user.name, email: req.user.email, contact: phone } });
    } catch (err) {
      if (!err.status) console.error(err);
      res.status(err.status ?? 500).json({ error: err.status ? err.message : "Something went wrong. Please try again.", fields: err.field ? [err.field] : undefined });
    }
  });

  // Step 2: payment is confirmed; edition numbers and serials are issued.
  app.post("/api/orders/:id/verify", requireUser, async (req, res) => {
    try {
      const secret = await serialSecret();
      const order = await withTransaction(async (session) => {
        const o = await orders.findOne({ _id: req.params.id, userId: req.user._id }, { session });
        if (!o) throw fail(404, "Order not found.");
        if (o.status === "paid") return o; // already confirmed: idempotent
        const proof = verifyPayment({ id: o._id, payment: o.payment }, req.body);

        await lockEdition(session);
        // A hold that lapsed can still complete if the edition has room for it.
        const stock = await stockView({ session, excludeOrderId: o._id });
        checkModelStock(stock, o.items, (p) => `The ${p.edition} edition filled up before payment completed. You will not be charged.`);

        // Each model numbers its own pieces (No. 001–200), in the order payments complete, from a
        // counter per model code in the edition document (issuedBy.AS, issuedBy.QO).
        await ensureModelCounters(session);
        const $inc = {};
        for (const line of o.items) $inc[`issuedBy.${findProduct(line.slug).code}`] = ($inc[`issuedBy.${findProduct(line.slug).code}`] ?? 0) + line.qty;
        const edition = await meta.findOneAndUpdate({ _id: "edition" }, { $inc }, { session, returnDocument: "after" });
        const next = Object.fromEntries(Object.entries($inc).map(([k, qty]) => [k.split(".")[1], edition.issuedBy[k.split(".")[1]] - qty + 1]));
        const issuedAt = new Date();
        const certificates = o.items.flatMap((line) => {
          const product = findProduct(line.slug);
          return Array.from({ length: line.qty }, () => {
            const number = next[product.code]++;
            return { serial: makeSerial(secret, product, number, o._id), number, slug: product.slug, model: `${product.name} ${product.edition}`, ownerName: o.customer.name, issuedAt };
          });
        });
        const payment = { ...o.payment, ...proof, paidAt: issuedAt };
        // The advance is acknowledged with a receipt voucher; the tax invoice follows on dispatch.
        const receipt = { number: await nextDocNumber("receipt", issuedAt, session), date: issuedAt };
        await orders.updateOne({ _id: o._id }, { $set: { status: "paid", certificates, payment, receipt } }, { session });
        return { ...o, status: "paid", certificates, payment, receipt, justPaid: true };
      });
      // Confirmation email with the receipt attached, once per order. A mail failure never fails the payment.
      if (order.justPaid) {
        const mail = orderConfirmationEmail(order, { siteUrl: siteUrl(req) });
        const result = await trySendMail({ to: order.customer.email, ...mail, attachments: [{ filename: docFile(order, "receipt"), content: await receiptPdf(order) }] });
        await orders.updateOne({ _id: order._id }, { $set: { "emails.confirmation": { at: new Date(), mode: MAIL_MODE, ok: !result.failed } } });
      }
      res.json({ order: orderView(order) });
    } catch (err) {
      if (!err.status) console.error(err);
      res.status(err.status ?? 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
    }
  });

  const docFile = (o, kind) => `RUBIIK-${kind === "receipt" ? "receipt" : "invoice"}-${o[kind].number.replaceAll("/", "-")}.pdf`;

  /**
   * Sends a paid order's receipt voucher or tax invoice as a PDF. A paid order from before receipts
   * existed gets its receipt number now (in a transaction, so numbering stays sequential). The tax
   * invoice exists only once the order has been dispatched.
   */
  async function sendDocument(res, o, kind, { download = false } = {}) {
    if (!o) return res.status(404).json({ error: "Order not found." });
    if (o.status !== "paid") return res.status(409).json({ error: "Documents are issued once payment is complete." });
    if (kind === "invoice" && !o.invoice) return res.status(409).json({ error: "The tax invoice is issued when your watch is dispatched." });
    if (kind === "receipt" && !o.receipt) {
      o.receipt = await withTransaction(async (session) => {
        const fresh = await orders.findOne({ _id: o._id }, { session });
        if (fresh.receipt) return fresh.receipt;
        const date = new Date(fresh.payment?.paidAt ?? fresh.createdAt);
        const receipt = { number: await nextDocNumber("receipt", date, session), date };
        await orders.updateOne({ _id: o._id }, { $set: { receipt } }, { session });
        return receipt;
      });
    }
    const pdf = kind === "receipt" ? await receiptPdf(o) : await invoicePdf(o);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${download ? "attachment" : "inline"}; filename="${docFile(o, kind)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(pdf);
  }

  /**
   * Marks a paid order as dispatched: records courier and tracking, issues the tax invoice (once)
   * and emails it to the customer. Used by the admin dashboard.
   */
  async function dispatchOrder(id, { courier = "", tracking = "" }, req) {
    const order = await withTransaction(async (session) => {
      const o = await orders.findOne({ _id: id }, { session });
      if (!o) throw fail(404, "Order not found.");
      if (o.status !== "paid") throw fail(409, "Only paid orders can be dispatched.");
      const at = new Date();
      const dispatch = { at: o.dispatch?.at ?? at, courier: String(courier).trim().slice(0, 60), tracking: String(tracking).trim().slice(0, 60) };
      const invoice = o.invoice ?? { number: await nextDocNumber("invoice", at, session), date: at };
      await orders.updateOne({ _id: id }, { $set: { dispatch, invoice } }, { session });
      return { ...o, dispatch, invoice };
    });
    const mail = dispatchEmail(order, { siteUrl: siteUrl(req) });
    const result = await trySendMail({ to: order.customer.email, ...mail, attachments: [{ filename: docFile(order, "invoice"), content: await invoicePdf(order) }] });
    await orders.updateOne({ _id: id }, { $set: { "emails.dispatch": { at: new Date(), mode: MAIL_MODE, ok: !result.failed } } });
    return { order, email: result };
  }

  // Customers can only fetch documents for their own orders.
  for (const kind of ["receipt", "invoice"]) {
    app.get(`/api/orders/:id/${kind}`, requireUser, async (req, res) => {
      const o = await orders.findOne({ _id: req.params.id, userId: req.user._id });
      await sendDocument(res, o, kind, { download: req.query.download === "1" });
    });
  }

  app.get("/api/me/orders", requireUser, async (req, res) => {
    const mine = await orders.find({ userId: req.user._id, ...holdingFilter() }).sort({ createdAt: -1 }).toArray();
    res.json({ orders: mine.map(orderView) });
  });

  // Public wall: only owners who opted in, only their chosen display name.
  app.get("/api/owners", async (_req, res) => {
    const paid = await orders.find({ status: "paid", "wall.show": true }, { projection: { certificates: 1, wall: 1 } }).toArray();
    const owners = paid
      .flatMap((o) => (o.certificates ?? []).map((c) => ({ serial: c.serial, number: c.number, slug: c.slug, model: c.model, displayName: o.wall.displayName, issuedAt: c.issuedAt })))
      .sort((a, b) => b.number - a.number);
    res.json({ owners, total: EDITION_TOTAL });
  });

  // Production: serve the built client and let React Router handle deep links.
  const dist = path.join(root, "dist");
  if (serveClient && existsSync(dist)) {
    // Build files carry a content hash in their name, so they can be cached for a year;
    // images for 30 days; index.html is always revalidated so a new release shows up at once.
    app.use("/assets", express.static(path.join(dist, "assets"), { maxAge: "1y", immutable: true, index: false }));
    app.use("/images", express.static(path.join(dist, "images"), { maxAge: "30d", index: false }));
    app.use(express.static(dist, { maxAge: "1d", index: false }));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  // Last-resort handler: never leak internals to the browser.
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });

  return { app, store, phase: phase(), forced: FORCE_PREBOOK, paymentMode: PAYMENT_MODE };
}
