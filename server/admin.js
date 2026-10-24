// Admin API: store overview, orders, customers, waitlist, owners-wall moderation and the media library.
// Every route requires a signed-in user whose email is listed in ADMIN_EMAILS.
import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import express from "express";
import { LAUNCH, PRODUCTS } from "../src/data/catalog.js";

const adminEmails = () =>
  new Set(
    String(process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
export const isAdmin = (user) => Boolean(user && adminEmails().has(user.email));

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

export function mountAdmin(app, { users, orders, waitlist }, { currentUser, root }) {
  async function requireAdmin(req, res, next) {
    try {
      const user = await currentUser(req);
      if (!user) return res.status(401).json({ error: "Please sign in." });
      if (!isAdmin(user)) return res.status(403).json({ error: "This account doesn't have admin access." });
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  }

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
      revenue: { paid: paid.reduce((n, o) => n + o.subtotal, 0), pending: held.reduce((n, o) => n + o.subtotal, 0) },
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
    const rows = [["Order", "Created", "Status", "Name", "Email", "Phone", "Address", "City", "PIN", "Items", "Total (INR)", "Serials", "On wall", "Payment ref"]];
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
        o.subtotal,
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
          admin: isAdmin(u),
          orders: mine.length,
          pieces: paid.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0),
          spent: paid.reduce((n, o) => n + o.subtotal, 0),
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
