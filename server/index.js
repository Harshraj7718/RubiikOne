// RUBIIK store API: launch status, live stock, accounts, pre-orders with payment,
// owner certificates and the public Founding Owners wall. Data lives in MongoDB (see db.js).
import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { PRODUCTS, LAUNCH, findProduct, phaseAt, unitPrice } from "../src/data/catalog.js";
import { connectDb } from "./db.js";
import { mountAuth } from "./auth.js";
import { mountAdmin } from "./admin.js";
import { PAYMENT_MODE, startPayment, verifyPayment } from "./payments.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// API_PORT, not PORT: dev tooling often sets PORT for the Vite server.
const PORT = Number(process.env.API_PORT ?? 8787);
const FORCE_PREBOOK = process.argv.includes("--force-prebook") || process.env.FORCE_PREBOOK === "1";
// How long an unpaid pre-order holds its pieces before they return to the edition.
const HOLD_MINUTES = 30;

let store;
try {
  store = await connectDb();
} catch (err) {
  console.error(`Could not connect to MongoDB: ${err.message}`);
  console.error("Check MONGODB_URI in .env and that this machine's IP is allowed in Atlas → Network Access.");
  process.exit(1);
}
const { users, orders, waitlist, meta, withTransaction } = store;

const app = express();
// Express 4 doesn't catch rejected promises from async handlers; send them to the error handler
// instead of letting a database hiccup crash the process.
for (const method of ["get", "post", "patch"]) {
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
const { requireUser, currentUser } = mountAuth(app, store);
mountAdmin(app, store, { currentUser, root });

const phase = () => phaseAt(Date.now(), FORCE_PREBOOK);
// Orders that currently claim pieces: paid ones, and unpaid ones whose hold hasn't lapsed.
const holdingFilter = () => ({ $or: [{ status: "paid" }, { status: "pending_payment", holdUntil: { $gt: new Date() } }] });

/** Both models draw from one numbered edition; paid orders and live holds count against it. */
async function stockView({ session, excludeOrderId } = {}) {
  const match = excludeOrderId ? { $and: [holdingFilter(), { _id: { $ne: excludeOrderId } }] } : holdingFilter();
  const rows = await orders
    .aggregate([{ $match: match }, { $unwind: "$items" }, { $group: { _id: "$items.slug", qty: { $sum: "$items.qty" } } }], { session })
    .toArray();
  const byModel = Object.fromEntries(PRODUCTS.map((p) => [p.slug, rows.find((r) => r._id === p.slug)?.qty ?? 0]));
  const reserved = Object.values(byModel).reduce((a, b) => a + b, 0);
  return { total: LAUNCH.editionSize, reserved, remaining: Math.max(0, LAUNCH.editionSize - reserved), byModel };
}

/**
 * Every reservation and payment confirmation writes this one document inside its transaction.
 * Concurrent transactions therefore conflict and are retried one after another, so two buyers
 * can never both take the last piece or receive the same edition number.
 */
const lockEdition = (session) => meta.updateOne({ _id: "edition" }, { $inc: { version: 1 } }, { upsert: true, session });

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
  customer: { name: o.customer.name, city: o.customer.city },
  wall: o.wall,
  certificates: o.certificates ?? [],
  paidAt: o.payment?.paidAt ?? null,
});

const fail = (status, message) => Object.assign(new Error(message), { status });

app.get("/api/status", async (_req, res) => {
  res.json({ phase: phase(), forced: FORCE_PREBOOK, paymentMode: PAYMENT_MODE, serverTime: new Date().toISOString(), launch: LAUNCH, stock: await stockView() });
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
  if (current === "teaser") return res.status(409).json({ error: "Pre-booking opens on 6 November." });

  const { customer = {}, items = [], wall = {} } = req.body ?? {};
  const phone = String(customer.phone ?? "").trim();
  const address = String(customer.address ?? "").trim();
  const city = String(customer.city ?? "").trim();
  const pincode = String(customer.pincode ?? "").trim();
  const showOnWall = wall.show === true;
  const displayName = String(wall.displayName ?? "").trim().slice(0, 40);

  const problems = [];
  if (!PHONE.test(phone)) problems.push("phone");
  if (address.length < 6) problems.push("address");
  if (city.length < 2) problems.push("city");
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
      const wanted = lines.reduce((n, l) => n + l.qty, 0);
      if (stock.remaining < wanted) throw fail(409, stock.remaining ? `Only ${stock.remaining} pieces of the edition remain.` : "The edition is fully reserved.");
      const doc = {
        _id: `RBK-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId: req.user._id,
        createdAt: new Date(),
        holdUntil: new Date(Date.now() + HOLD_MINUTES * 60000),
        phase: current,
        customer: { name: req.user.name, email: req.user.email, phone, address, city, pincode },
        items: lines,
        subtotal: lines.reduce((n, l) => n + l.unitPrice * l.qty, 0),
        compareAt: lines.reduce((n, l) => n + findProduct(l.slug).price * l.qty, 0),
        wall: { show: showOnWall, displayName: showOnWall ? displayName : null },
        status: "pending_payment",
      };
      await orders.insertOne(doc, { session });
      return doc;
    });
    const payment = await startPayment({ id: order._id, subtotal: order.subtotal });
    await orders.updateOne({ _id: order._id }, { $set: { payment: { provider: payment.provider, providerOrderId: payment.providerOrderId ?? null } } });
    res.status(201).json({ order: orderView(order), payment: { ...payment, name: req.user.name, email: req.user.email, contact: phone } });
  } catch (err) {
    if (!err.status) console.error(err);
    res.status(err.status ?? 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
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
      const wanted = o.items.reduce((n, i) => n + i.qty, 0);
      if (stock.remaining < wanted) throw fail(409, "The edition filled up before payment completed. You will not be charged.");

      // Numbers follow the order in which payments complete, from a counter in the edition document.
      const edition = await meta.findOneAndUpdate({ _id: "edition" }, { $inc: { issued: wanted } }, { session, returnDocument: "after" });
      let next = edition.issued - wanted + 1;
      const issuedAt = new Date();
      const certificates = o.items.flatMap((line) => {
        const product = findProduct(line.slug);
        return Array.from({ length: line.qty }, () => {
          const number = next++;
          return { serial: makeSerial(secret, product, number, o._id), number, slug: product.slug, model: `${product.name} ${product.edition}`, ownerName: o.customer.name, issuedAt };
        });
      });
      const payment = { ...o.payment, ...proof, paidAt: issuedAt };
      await orders.updateOne({ _id: o._id }, { $set: { status: "paid", certificates, payment } }, { session });
      return { ...o, status: "paid", certificates, payment };
    });
    res.json({ order: orderView(order) });
  } catch (err) {
    if (!err.status) console.error(err);
    res.status(err.status ?? 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
  }
});

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
  res.json({ owners, total: LAUNCH.editionSize });
});

// Production: serve the built client and let React Router handle deep links.
const dist = path.join(root, "dist");
if (existsSync(dist)) {
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

app.listen(PORT, () => {
  console.log(`RUBIIK API on http://localhost:${PORT} — MongoDB "${store.db.databaseName}" — phase: ${phase()}${FORCE_PREBOOK ? " (forced)" : ""} — payments: ${PAYMENT_MODE}`);
});
