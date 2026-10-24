// RUBIIK store API: launch status, live stock, waitlist and pre-booking orders.
// Orders are kept in a JSON file; swap `store` for a database before going live.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PRODUCTS, LAUNCH, findProduct, phaseAt, unitPrice } from "../src/data/catalog.js";
import { createStore } from "./store.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// API_PORT, not PORT: dev tooling often sets PORT for the Vite server.
const PORT = Number(process.env.API_PORT ?? 8787);
const FORCE_PREBOOK = process.argv.includes("--force-prebook") || process.env.FORCE_PREBOOK === "1";

const store = await createStore(path.join(root, "server", "data", "db.json"));
const app = express();
app.use(express.json({ limit: "32kb" }));

const phase = () => phaseAt(Date.now(), FORCE_PREBOOK);

// Both models draw from one numbered edition of LAUNCH.editionSize pieces.
function stockView(db) {
  const items = db.orders.flatMap((o) => o.items);
  const byModel = Object.fromEntries(PRODUCTS.map((p) => [p.slug, items.filter((i) => i.slug === p.slug).reduce((n, i) => n + i.qty, 0)]));
  const reserved = Object.values(byModel).reduce((a, b) => a + b, 0);
  return { total: LAUNCH.editionSize, reserved, remaining: Math.max(0, LAUNCH.editionSize - reserved), byModel };
}

app.get("/api/status", async (_req, res) => {
  const db = await store.read();
  res.json({ phase: phase(), forced: FORCE_PREBOOK, serverTime: new Date().toISOString(), launch: LAUNCH, stock: stockView(db) });
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s-]{8,15}$/;

app.post("/api/waitlist", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  await store.update((db) => {
    if (!db.waitlist.some((w) => w.email === email)) db.waitlist.push({ email, at: new Date().toISOString() });
  });
  res.json({ ok: true });
});

app.post("/api/prebook", async (req, res) => {
  const current = phase();
  if (current === "teaser") return res.status(409).json({ error: "Pre-booking opens on 6 November." });

  const { customer = {}, items = [] } = req.body ?? {};
  const name = String(customer.name ?? "").trim();
  const email = String(customer.email ?? "").trim().toLowerCase();
  const phone = String(customer.phone ?? "").trim();
  const address = String(customer.address ?? "").trim();
  const city = String(customer.city ?? "").trim();
  const pincode = String(customer.pincode ?? "").trim();

  const problems = [];
  if (name.length < 2) problems.push("name");
  if (!EMAIL.test(email)) problems.push("email");
  if (!PHONE.test(phone)) problems.push("phone");
  if (address.length < 6) problems.push("address");
  if (city.length < 2) problems.push("city");
  if (!/^\d{6}$/.test(pincode)) problems.push("pincode");
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

  let order;
  try {
    await store.update((db) => {
      const stock = stockView(db);
      const wanted = lines.reduce((n, l) => n + l.qty, 0);
      if (stock.remaining < wanted) {
        const msg = stock.remaining ? `Only ${stock.remaining} pieces of the edition remain.` : "The edition is fully reserved.";
        throw Object.assign(new Error(msg), { status: 409 });
      }
      // Each piece gets the next number in the shared edition (e.g. 017/200).
      let next = stock.reserved + 1;
      const items = lines.map((l) => ({ ...l, editionNumbers: Array.from({ length: l.qty }, () => next++) }));
      order = {
        id: `RBK-${randomUUID().slice(0, 8).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        phase: current,
        customer: { name, email, phone, address, city, pincode },
        items,
        subtotal: items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
        compareAt: items.reduce((n, i) => n + findProduct(i.slug).price * i.qty, 0),
        status: "reserved",
      };
      db.orders.push(order);
    });
  } catch (err) {
    return res.status(err.status ?? 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
  }
  res.status(201).json({ order });
});

// Production: serve the built client and let React Router handle deep links.
const dist = path.join(root, "dist");
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: "7d", index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`RUBIIK API on http://localhost:${PORT} — phase: ${phase()}${FORCE_PREBOOK ? " (forced)" : ""}`);
});
