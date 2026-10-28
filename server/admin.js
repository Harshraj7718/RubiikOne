// Admin API: store overview, orders, customers, waitlist, owners-wall moderation and the media library.
// Access uses one admin username and password (ADMIN_USERNAME / ADMIN_PASSWORD in the environment),
// separate from customer accounts. A successful login gets its own short-lived, httpOnly session cookie.
import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import express from "express";
import { LAUNCH, PRODUCTS, couponLabel } from "../src/data/catalog.js";
import { readCookie } from "./auth.js";

const ADMIN_COOKIE = "rbk_admin";
const ADMIN_SESSION_HOURS = 12;
const sha256 = (s) => createHash("sha256").update(String(s)).digest();
// Compares fixed-length digests so the check takes the same time whatever was typed.
const sameSecret = (given, expected) => timingSafeEqual(sha256(given), sha256(expected));
const adminConfigured = () => Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);

/** At most `max` attempts per key in each window. */
export function createLimiter({ max, windowMs }) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}

function setAdminCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`);
}

// Amount charged incl. GST; the earliest orders only stored a subtotal.
const orderTotal = (o) => o.total ?? o.subtotal;
const IMAGE = /\.(webp|png|jpe?g|svg|gif|avif)$/i;
// Cells starting with these could run as formulas when a CSV is opened in a spreadsheet.
const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

const shortName = (name = "") => {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first ?? "";
};

export function mountAdmin(app, { users, orders, waitlist, sessions, coupons }, { root }) {
  const limitLogin = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

  /** The signed-in admin for this request, or null. Admin sessions live in `sessions` with admin: true. */
  async function currentAdmin(req) {
    const token = readCookie(req, ADMIN_COOKIE);
    if (!token) return null;
    const session = await sessions.findOne({ hash: sha256(token).toString("hex"), admin: true, expiresAt: { $gt: new Date() } });
    return session ? { username: session.username } : null;
  }

  async function requireAdmin(req, res, next) {
    try {
      const admin = await currentAdmin(req);
      if (!admin) return res.status(401).json({ error: "Please sign in as admin." });
      req.admin = admin;
      next();
    } catch (err) {
      next(err);
    }
  }

  app.post("/api/admin/login", async (req, res) => {
    if (!adminConfigured()) return res.status(503).json({ error: "Admin login isn't set up. Add ADMIN_USERNAME and ADMIN_PASSWORD to the server environment." });
    if (!limitLogin(req.ip)) return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
    const username = String(req.body?.username ?? "");
    const password = String(req.body?.password ?? "");
    // Check both, always, so a wrong username and a wrong password look the same.
    const ok = sameSecret(username, process.env.ADMIN_USERNAME) & sameSecret(password, process.env.ADMIN_PASSWORD);
    if (!ok) return res.status(401).json({ error: "That username and password don't match." });
    const token = randomBytes(32).toString("base64url");
    await sessions.insertOne({ hash: sha256(token).toString("hex"), admin: true, username: process.env.ADMIN_USERNAME, expiresAt: new Date(Date.now() + ADMIN_SESSION_HOURS * 3600000) });
    setAdminCookie(res, token, ADMIN_SESSION_HOURS * 3600);
    res.json({ admin: { username: process.env.ADMIN_USERNAME } });
  });

  app.post("/api/admin/logout", async (req, res) => {
    const token = readCookie(req, ADMIN_COOKIE);
    if (token) await sessions.deleteOne({ hash: sha256(token).toString("hex"), admin: true });
    setAdminCookie(res, "", 0);
    res.json({ ok: true });
  });

  app.get("/api/admin/me", async (req, res) => {
    res.json({ admin: await currentAdmin(req), configured: adminConfigured() });
  });

  // An unpaid order whose hold has lapsed is reported as expired.
  const effectiveStatus = (o, now = Date.now()) => (o.status === "pending_payment" && new Date(o.holdUntil).getTime() <= now ? "expired" : o.status);

  const adminOrder = (o) => ({
    id: o._id,
    createdAt: o.createdAt,
    status: effectiveStatus(o),
    holdUntil: o.holdUntil,
    customer: o.customer,
    items: o.items,
    subtotal: o.subtotal,
    compareAt: o.compareAt,
    gst: o.gst ?? 0,
    total: orderTotal(o),
    coupon: o.coupon ? { code: o.coupon.code, discount: o.coupon.discount } : null,
    wall: o.wall,
    certificates: o.certificates ?? [],
    payment: o.payment ? { provider: o.payment.provider, reference: o.payment.reference ?? null, paidAt: o.payment.paidAt ?? null } : null,
  });

  app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
    const all = await orders.find({}, { projection: { "customer.address": 0 } }).sort({ createdAt: -1 }).toArray();
    const now = Date.now();
    const paid = all.filter((o) => o.status === "paid");
    const held = all.filter((o) => effectiveStatus(o, now) === "pending_payment");
    const pieces = (list) => list.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0);
    const byModel = PRODUCTS.map((p) => ({
      slug: p.slug,
      edition: p.edition,
      accent: p.accent,
      paid: paid.flatMap((o) => o.items).filter((i) => i.slug === p.slug).reduce((n, i) => n + i.qty, 0),
    }));
    // Paid pieces per day for the last 14 days (IST calendar days).
    const day = (d) => new Date(new Date(d).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
    const days = Array.from({ length: 14 }, (_, i) => day(now - (13 - i) * 86400000));
    const daily = days.map((d) => ({
      day: d,
      pieces: paid.filter((o) => day(o.payment?.paidAt ?? o.createdAt) === d).reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0),
    }));
    res.json({
      edition: { total: LAUNCH.editionSize, sold: pieces(paid), held: pieces(held), remaining: Math.max(0, LAUNCH.editionSize - pieces(paid) - pieces(held)) },
      revenue: { paid: paid.reduce((n, o) => n + orderTotal(o), 0), pending: held.reduce((n, o) => n + orderTotal(o), 0) },
      counts: {
        customers: await users.countDocuments(),
        waitlist: await waitlist.countDocuments(),
        paidOrders: paid.length,
        pendingOrders: held.length,
        onWall: paid.filter((o) => o.wall?.show).length,
      },
      byModel,
      daily,
      launch: LAUNCH,
      recent: all.slice(0, 8).map(adminOrder),
    });
  });

  async function findOrders(query) {
    const status = String(query.status ?? "all");
    const q = String(query.q ?? "").trim().toLowerCase();
    const list = (await orders.find({}).sort({ createdAt: -1 }).toArray()).map(adminOrder);
    return list.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      const hay = [o.id, o.customer.name, o.customer.email, o.customer.phone, o.customer.city, ...o.certificates.map((c) => c.serial)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    res.json({ orders: await findOrders(req.query) });
  });

  app.get("/api/admin/orders.csv", requireAdmin, async (req, res) => {
    const list = await findOrders(req.query);
    const rows = [["Order", "Created", "Status", "Name", "Email", "Phone", "Address", "City", "PIN", "Items", "Total incl. GST (INR)", "Coupon", "Serials", "On wall", "Payment ref"]];
    for (const o of list) {
      rows.push([
        o.id,
        new Date(o.createdAt).toISOString(),
        o.status,
        o.customer.name,
        o.customer.email,
        o.customer.phone,
        o.customer.address,
        o.customer.city,
        o.customer.pincode,
        o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
        o.total,
        o.coupon ? `${o.coupon.code} (-${o.coupon.discount})` : "",
        o.certificates.map((c) => c.serial).join("; "),
        o.wall?.show ? o.wall.displayName : "",
        o.payment?.reference ?? "",
      ]);
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="rubiik-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send("﻿" + toCsv(rows));
  });

  app.get("/api/admin/customers", requireAdmin, async (_req, res) => {
    const [list, all] = await Promise.all([users.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray(), orders.find({}).toArray()]);
    res.json({
      customers: list.map((u) => {
        const mine = all.filter((o) => o.userId === u._id);
        const paid = mine.filter((o) => o.status === "paid");
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          orders: mine.length,
          pieces: paid.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0),
          spent: paid.reduce((n, o) => n + orderTotal(o), 0),
          serials: paid.flatMap((o) => (o.certificates ?? []).map((c) => c.serial)),
        };
      }),
    });
  });

  app.get("/api/admin/waitlist", requireAdmin, async (_req, res) => {
    res.json({ waitlist: await waitlist.find({}, { projection: { _id: 0 } }).sort({ at: -1 }).toArray() });
  });

  app.get("/api/admin/waitlist.csv", requireAdmin, async (_req, res) => {
    const list = await waitlist.find({}).sort({ at: -1 }).toArray();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="rubiik-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send("﻿" + toCsv([["Email", "Joined"], ...list.map((w) => [w.email, new Date(w.at).toISOString()])]));
  });

  // Owners wall moderation: show or hide a paid order's card.
  // ---------- Coupons ----------
  // Codes are stored upper-case as the document _id. Uses are counted from orders (paid, or held
  // and still within their payment window), so cancelled or abandoned checkouts free their use.
  const COUPON_CODE = /^[A-Z0-9-]{4,20}$/;
  const CODE_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, which are easy to misread
  const newCode = () => `RBK${Array.from({ length: 6 }, () => CODE_LETTERS[randomInt(CODE_LETTERS.length)]).join("")}`;

  async function couponRows() {
    const list = await coupons.find({}).sort({ createdAt: -1 }).toArray();
    const now = Date.now();
    const usage = await orders.find({ coupon: { $ne: null } }, { projection: { coupon: 1, status: 1, holdUntil: 1 } }).toArray();
    return list.map((c) => {
      const mine = usage.filter((o) => o.coupon?.code === c._id);
      const paid = mine.filter((o) => o.status === "paid");
      return {
        code: c._id,
        type: c.type,
        value: c.value,
        label: couponLabel(c),
        maxUses: c.maxUses ?? null,
        expiresAt: c.expiresAt ?? null,
        active: c.active,
        expired: Boolean(c.expiresAt && new Date(c.expiresAt).getTime() <= now),
        note: c.note ?? "",
        createdAt: c.createdAt,
        used: paid.length,
        held: mine.filter((o) => effectiveStatus(o, now) === "pending_payment").length,
        discountGiven: paid.reduce((n, o) => n + (o.coupon.discount ?? 0), 0),
        everUsed: mine.length > 0,
      };
    });
  }

  app.get("/api/admin/coupons", requireAdmin, async (_req, res) => {
    res.json({ coupons: await couponRows() });
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    const body = req.body ?? {};
    const type = body.type === "fixed" ? "fixed" : "percent";
    const value = Math.floor(Number(body.value));
    const maxUses = body.maxUses === "" || body.maxUses == null ? null : Math.floor(Number(body.maxUses));
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const note = String(body.note ?? "").trim().slice(0, 80);
    let code = String(body.code ?? "").trim().toUpperCase();

    if (code && !COUPON_CODE.test(code)) return res.status(400).json({ error: "Codes use 4–20 letters, numbers or dashes." });
    if (type === "percent" && !(value >= 1 && value <= 90)) return res.status(400).json({ error: "A percentage must be between 1 and 90." });
    if (type === "fixed" && !(value >= 1 && value <= 100000)) return res.status(400).json({ error: "Enter an amount between ₹1 and ₹1,00,000." });
    if (maxUses !== null && !(maxUses >= 1)) return res.status(400).json({ error: "Usage limit must be at least 1, or left empty." });
    if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())) return res.status(400).json({ error: "The expiry must be a future date." });

    const doc = { type, value, maxUses, expiresAt, note, active: true, createdAt: new Date() };
    try {
      if (code) await coupons.insertOne({ _id: code, ...doc });
      else {
        // A generated code is retried in the (very unlikely) event it already exists.
        for (let tries = 0; ; tries++) {
          code = newCode();
          try {
            await coupons.insertOne({ _id: code, ...doc });
            break;
          } catch (err) {
            if (err.code !== 11000 || tries >= 4) throw err;
          }
        }
      }
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: `The code ${code} already exists.` });
      throw err;
    }
    res.status(201).json({ coupon: (await couponRows()).find((c) => c.code === code) });
  });

  app.patch("/api/admin/coupons/:code", requireAdmin, async (req, res) => {
    const { matchedCount } = await coupons.updateOne({ _id: String(req.params.code).toUpperCase() }, { $set: { active: req.body?.active === true } });
    if (!matchedCount) return res.status(404).json({ error: "Coupon not found." });
    res.json({ ok: true });
  });

  // A coupon that any order has used is kept for the record; pause it instead.
  app.delete("/api/admin/coupons/:code", requireAdmin, async (req, res) => {
    const code = String(req.params.code).toUpperCase();
    if (await orders.countDocuments({ "coupon.code": code }, { limit: 1 })) {
      return res.status(409).json({ error: "This coupon has been used on an order, so it can only be paused." });
    }
    const { deletedCount } = await coupons.deleteOne({ _id: code });
    if (!deletedCount) return res.status(404).json({ error: "Coupon not found." });
    res.json({ ok: true });
  });

  app.patch("/api/admin/orders/:id/wall", requireAdmin, async (req, res) => {
    const show = req.body?.show === true;
    const order = await orders.findOne({ _id: req.params.id });
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.status !== "paid") return res.status(409).json({ error: "Only paid orders appear on the wall." });
    const displayName = String(req.body?.displayName ?? order.wall?.displayName ?? shortName(order.customer.name)).trim().slice(0, 40) || shortName(order.customer.name);
    await orders.updateOne({ _id: order._id }, { $set: { wall: { show, displayName: show ? displayName : order.wall?.displayName ?? null } } });
    res.json({ order: adminOrder(await orders.findOne({ _id: order._id })) });
  });

  // Media library: every image the site ships, which source files use it, and the original brand files.
  async function listImages(dir, urlPrefix) {
    if (!existsSync(dir)) return [];
    const names = (await readdir(dir)).filter((n) => IMAGE.test(n));
    return Promise.all(names.map(async (name) => ({ name, url: `${urlPrefix}/${name}`, bytes: (await stat(path.join(dir, name))).size })));
  }
  async function sourceFiles(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await sourceFiles(full)));
      else if (/\.(jsx?|tsx?|css)$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  app.get("/api/admin/assets", requireAdmin, async (_req, res) => {
    const [site, originals, files] = await Promise.all([
      listImages(path.join(root, "public", "images"), "/images"),
      listImages(path.join(root, "brand-source"), "/api/admin/brand-source"),
      sourceFiles(path.join(root, "src")),
    ]);
    const sources = await Promise.all(files.map(async (f) => ({ file: path.relative(path.join(root, "src"), f).replace(/\\/g, "/"), text: await readFile(f, "utf8") })));
    for (const img of site) img.usedIn = sources.filter((s) => s.text.includes(`/images/${img.name}`)).map((s) => s.file);
    res.json({ site, originals });
  });

  // Original brand files are not public; admins can preview and download them here.
  app.use("/api/admin/brand-source", requireAdmin, express.static(path.join(root, "brand-source"), { index: false, dotfiles: "deny" }));
}
