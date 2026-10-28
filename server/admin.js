// Admin API: store overview, orders, customers, waitlist, owners-wall moderation and the media library.
// Admins are separate from customer accounts. The account in the environment (ADMIN_USERNAME /
// ADMIN_PASSWORD) is the built-in owner; owners can add team members (owner or staff) with their own
// usernames and passwords. Each login gets its own short-lived, httpOnly session cookie, and every
// sign-in and every change an admin makes is written to the activity log.
import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import express from "express";
import { LAUNCH, PRODUCTS, EDITION_TOTAL, couponLabel } from "../src/data/catalog.js";
import { readCookie, hashPassword, verifyPassword } from "./auth.js";
import { trySendMail, MAIL_MODE } from "./mailer.js";
import { launchEmail } from "./emails.js";

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

export function mountAdmin(app, { users, orders, waitlist, sessions, coupons, admins, audit }, { root, sendDocument, dispatchOrder, siteUrl }) {
  const limitLogin = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });
  const ENV_OWNER = () => process.env.ADMIN_USERNAME;

  /** Writes one activity-log entry. Never fails the request it records. */
  async function record(req, action, target = null, details = null, who = req.admin) {
    try {
      await audit.insertOne({ at: new Date(), admin: who?.username ?? null, role: who?.role ?? null, action, target, details, ip: req.ip });
    } catch (err) {
      console.error("Activity log write failed:", err.message);
    }
  }

  /**
   * The signed-in admin for this request, or null. Admin sessions live in `sessions` with admin: true.
   * Team members are re-checked on every request, so deactivating someone or changing their role
   * takes effect at once.
   */
  async function currentAdmin(req) {
    const token = readCookie(req, ADMIN_COOKIE);
    if (!token) return null;
    const session = await sessions.findOne({ hash: sha256(token).toString("hex"), admin: true, expiresAt: { $gt: new Date() } });
    if (!session) return null;
    if (session.source !== "team") return { username: session.username, name: "Owner", role: "owner", builtIn: true };
    const member = await admins.findOne({ _id: session.username, active: true });
    return member ? { username: member._id, name: member.name, role: member.role, builtIn: false } : null;
  }

  async function requireOwner(req, res, next) {
    if (req.admin?.role !== "owner") return res.status(403).json({ error: "Only an owner can do this." });
    next();
  }

  // Compared against when a username doesn't exist, so unknown and known usernames take equally long.
  let dummyHash;
  const DUMMY = async () => (dummyHash ??= await hashPassword(randomBytes(16).toString("hex")));

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
    if (!adminConfigured() && !(await admins.countDocuments({ active: true }, { limit: 1 }))) {
      return res.status(503).json({ error: "Admin login isn't set up. Add ADMIN_USERNAME and ADMIN_PASSWORD to the server environment." });
    }
    if (!limitLogin(req.ip)) return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");

    // The built-in owner from the environment: both fields checked in constant time.
    let who = null;
    if (adminConfigured() && sameSecret(username, ENV_OWNER()) & sameSecret(password, process.env.ADMIN_PASSWORD)) {
      who = { username: ENV_OWNER(), role: "owner", source: "env" };
    } else {
      // Team members: always run one password check, so a wrong username and a wrong password look the same.
      const member = await admins.findOne({ _id: username.toLowerCase(), active: true });
      const valid = await verifyPassword(password, member?.passwordHash ?? (await DUMMY()));
      if (member && valid) who = { username: member._id, role: member.role, source: "team" };
    }
    if (!who) {
      await record(req, "login.failed", username.slice(0, 40) || null, null, null);
      return res.status(401).json({ error: "That username and password don't match." });
    }
    const token = randomBytes(32).toString("base64url");
    await sessions.insertOne({ hash: sha256(token).toString("hex"), admin: true, username: who.username, source: who.source, expiresAt: new Date(Date.now() + ADMIN_SESSION_HOURS * 3600000) });
    if (who.source === "team") await admins.updateOne({ _id: who.username }, { $set: { lastLoginAt: new Date() } });
    setAdminCookie(res, token, ADMIN_SESSION_HOURS * 3600);
    await record(req, "login", null, null, who);
    res.json({ admin: await currentAdmin({ headers: { cookie: `${ADMIN_COOKIE}=${encodeURIComponent(token)}` } }) });
  });

  app.post("/api/admin/logout", async (req, res) => {
    const who = await currentAdmin(req);
    const token = readCookie(req, ADMIN_COOKIE);
    if (token) await sessions.deleteOne({ hash: sha256(token).toString("hex"), admin: true });
    setAdminCookie(res, "", 0);
    if (who) await record(req, "logout", null, null, who);
    res.json({ ok: true });
  });

  // Activity log for every successful admin change, export and document view. One hook here covers
  // all admin routes, so a new route is logged as soon as it is listed in AUDITED.
  const AUDITED = [
    [/^POST \/api\/admin\/coupons$/, () => "coupon.create", (req, m, body) => body?.coupon?.code, (req) => ({ type: req.body?.type, value: req.body?.value, maxUses: req.body?.maxUses || null, expiresAt: req.body?.expiresAt || null })],
    [/^PATCH \/api\/admin\/coupons\/([^/]+)$/, (req) => (req.body?.active ? "coupon.resume" : "coupon.pause"), (req, m) => decodeURIComponent(m[1]).toUpperCase()],
    [/^DELETE \/api\/admin\/coupons\/([^/]+)$/, () => "coupon.delete", (req, m) => decodeURIComponent(m[1]).toUpperCase()],
    [/^PATCH \/api\/admin\/orders\/([^/]+)\/wall$/, () => "wall.update", (req, m) => m[1], (req) => ({ show: req.body?.show, displayName: req.body?.displayName })],
    [/^POST \/api\/admin\/orders\/([^/]+)\/dispatch$/, () => "order.dispatch", (req, m) => m[1], (req, m, body) => ({ courier: req.body?.courier, tracking: req.body?.tracking, invoice: body?.invoiceNumber, email: body?.email })],
    [/^GET \/api\/admin\/orders\/([^/]+)\/(receipt|invoice)$/, (req, m) => `document.${m[2]}`, (req, m) => m[1]],
    [/^GET \/api\/admin\/(orders|waitlist)\.csv$/, (req, m) => `export.${m[1]}`, () => null, (req) => (Object.keys(req.query).length ? req.query : null)],
    [/^POST \/api\/admin\/emails\/launch$/, () => "email.launch", () => null, (req, m, body) => ({ sent: body?.sent, failed: body?.failed, remaining: body?.remaining, mode: body?.mode })],
    [/^POST \/api\/admin\/team$/, () => "team.add", (req) => String(req.body?.username ?? "").toLowerCase(), (req) => ({ role: req.body?.role })],
    [/^PATCH \/api\/admin\/team\/([^/]+)$/, () => "team.update", (req, m) => decodeURIComponent(m[1]), (req) => ({ active: req.body?.active, role: req.body?.role, passwordReset: req.body?.password ? true : undefined })],
    [/^POST \/api\/admin\/password$/, () => "account.password", () => null],
  ];
  app.use("/api/admin", (req, res, next) => {
    const key = `${req.method} ${req.originalUrl.split("?")[0]}`;
    const rule = AUDITED.find(([re]) => re.test(key));
    if (!rule) return next();
    const [re, action, target, details] = rule;
    let body;
    const json = res.json.bind(res);
    res.json = (data) => ((body = data), json(data));
    res.on("finish", () => {
      if (res.statusCode >= 400 || !req.admin) return;
      const m = key.match(re);
      record(req, action(req, m, body), target(req, m, body) ?? null, details ? details(req, m, body) : null);
    });
    next();
  });

  app.get("/api/admin/me", async (req, res) => {
    res.json({ admin: await currentAdmin(req), configured: adminConfigured() || (await admins.countDocuments({ active: true }, { limit: 1 })) > 0 });
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
    receiptNumber: o.receipt?.number ?? null,
    invoiceNumber: o.invoice?.number ?? null,
    dispatch: o.dispatch ?? null,
    emails: o.emails ?? {},
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
      held: held.flatMap((o) => o.items).filter((i) => i.slug === p.slug).reduce((n, i) => n + i.qty, 0),
      total: LAUNCH.editionPerModel,
    })).map((m) => ({ ...m, remaining: Math.max(0, m.total - m.paid - m.held) }));
    // Paid pieces per day for the last 14 days (IST calendar days).
    const day = (d) => new Date(new Date(d).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
    const days = Array.from({ length: 14 }, (_, i) => day(now - (13 - i) * 86400000));
    const daily = days.map((d) => ({
      day: d,
      pieces: paid.filter((o) => day(o.payment?.paidAt ?? o.createdAt) === d).reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0),
    }));
    res.json({
      edition: { total: EDITION_TOTAL, perModel: LAUNCH.editionPerModel, sold: pieces(paid), held: pieces(held), remaining: Math.max(0, EDITION_TOTAL - pieces(paid) - pieces(held)) },
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
    const rows = [["Order", "Created", "Status", "Name", "Email", "Phone", "Address", "City", "PIN", "Items", "Total incl. GST (INR)", "Coupon", "Receipt no.", "Invoice no.", "Dispatched", "Tracking", "Serials", "On wall", "Payment ref"]];
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
        o.receiptNumber ?? "",
        o.invoiceNumber ?? "",
        o.dispatch?.at ? new Date(o.dispatch.at).toISOString().slice(0, 10) : "",
        o.dispatch ? [o.dispatch.courier, o.dispatch.tracking].filter(Boolean).join(" ") : "",
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
  for (const kind of ["receipt", "invoice"]) {
    app.get(`/api/admin/orders/:id/${kind}`, requireAdmin, async (req, res) => {
      await sendDocument(res, await orders.findOne({ _id: req.params.id }), kind, { download: req.query.download === "1" });
    });
  }

  // Dispatch: issues the tax invoice and emails it with the tracking details.
  app.post("/api/admin/orders/:id/dispatch", requireAdmin, async (req, res) => {
    try {
      const { order, email } = await dispatchOrder(req.params.id, req.body ?? {}, req);
      res.json({ ok: true, invoiceNumber: order.invoice.number, email: email.failed ? "failed" : email.sent ? "sent" : "logged" });
    } catch (err) {
      if (!err.status) throw err;
      res.status(err.status).json({ error: err.message });
    }
  });

  // ---------- Launch email ----------
  // Goes to every pre-order owner and everyone on the waitlist, once each. It is sent in small
  // batches (each call sends up to LAUNCH_BATCH and reports what's left) so a request never runs
  // longer than the hosting time limit; the dashboard keeps calling until nothing is left.
  const LAUNCH_BATCH = 12;
  async function launchRecipients() {
    const ownerIds = await orders.distinct("userId", { status: "paid" });
    const owners = await users.find({ _id: { $in: ownerIds } }, { projection: { name: 1, email: 1, launchEmailAt: 1 } }).toArray();
    const ownerEmails = new Set(owners.map((u) => u.email));
    const list = await waitlist.find({}, { projection: { email: 1, launchEmailAt: 1 } }).toArray();
    return [
      ...owners.map((u) => ({ kind: "owner", id: u._id, email: u.email, name: u.name, sent: Boolean(u.launchEmailAt) })),
      // Owners who also joined the waitlist get only the owner email.
      ...list.filter((w) => !ownerEmails.has(w.email)).map((w) => ({ kind: "waitlist", id: w._id, email: w.email, name: "", sent: Boolean(w.launchEmailAt) })),
    ];
  }

  app.get("/api/admin/emails/launch", requireAdmin, async (_req, res) => {
    const all = await launchRecipients();
    res.json({ mode: MAIL_MODE, total: all.length, sent: all.filter((r) => r.sent).length, owners: all.filter((r) => r.kind === "owner").length });
  });

  app.post("/api/admin/emails/launch", requireAdmin, async (req, res) => {
    const pending = (await launchRecipients()).filter((r) => !r.sent);
    let sent = 0;
    let failed = 0;
    for (const r of pending.slice(0, LAUNCH_BATCH)) {
      const mail = launchEmail({ name: r.name, owner: r.kind === "owner" }, { siteUrl: siteUrl(req) });
      const result = await trySendMail({ to: r.email, ...mail });
      if (result.failed) {
        failed++;
        continue;
      }
      sent++;
      const now = new Date();
      if (r.kind === "owner") {
        await users.updateOne({ _id: r.id }, { $set: { launchEmailAt: now } });
        await waitlist.updateOne({ email: r.email }, { $set: { launchEmailAt: now } });
      } else await waitlist.updateOne({ _id: r.id }, { $set: { launchEmailAt: now } });
    }
    res.json({ sent, failed, remaining: Math.max(0, pending.length - sent - failed), mode: MAIL_MODE });
  });

  // ---------- Team ----------
  const USERNAME = /^[a-z0-9._-]{3,32}$/;
  const ROLES = ["owner", "staff"];
  const teamRow = (a) => ({ username: a._id, name: a.name, role: a.role, active: a.active, createdAt: a.createdAt, createdBy: a.createdBy, lastLoginAt: a.lastLoginAt ?? null, builtIn: false });

  app.get("/api/admin/team", requireAdmin, requireOwner, async (_req, res) => {
    const list = await admins.find({}).sort({ createdAt: 1 }).toArray();
    const builtIn = adminConfigured() ? [{ username: ENV_OWNER(), name: "Owner", role: "owner", active: true, builtIn: true }] : [];
    res.json({ team: [...builtIn, ...list.map(teamRow)] });
  });

  app.post("/api/admin/team", requireAdmin, requireOwner, async (req, res) => {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const name = String(req.body?.name ?? "").trim().slice(0, 60);
    const password = String(req.body?.password ?? "");
    const role = ROLES.includes(req.body?.role) ? req.body.role : "staff";
    if (!USERNAME.test(username)) return res.status(400).json({ error: "Usernames use 3–32 lower-case letters, numbers, dots, dashes or underscores." });
    if (adminConfigured() && username === ENV_OWNER().toLowerCase()) return res.status(409).json({ error: "That username is the built-in owner." });
    if (name.length < 2) return res.status(400).json({ error: "Please enter their name." });
    if (password.length < 12) return res.status(400).json({ error: "Use a password of at least 12 characters." });
    try {
      await admins.insertOne({ _id: username, name, role, active: true, passwordHash: await hashPassword(password), createdAt: new Date(), createdBy: req.admin.username });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: `The username ${username} is already taken.` });
      throw err;
    }
    res.status(201).json({ member: teamRow(await admins.findOne({ _id: username })) });
  });

  // Owners change a member's role, deactivate or reactivate them, or set a new password.
  // Deactivating or resetting a password signs that person out everywhere.
  app.patch("/api/admin/team/:username", requireAdmin, requireOwner, async (req, res) => {
    const username = String(req.params.username).toLowerCase();
    const member = await admins.findOne({ _id: username });
    if (!member) return res.status(404).json({ error: "Team member not found." });
    const $set = {};
    if (typeof req.body?.active === "boolean") $set.active = req.body.active;
    if (ROLES.includes(req.body?.role)) $set.role = req.body.role;
    if (req.body?.password) {
      if (String(req.body.password).length < 12) return res.status(400).json({ error: "Use a password of at least 12 characters." });
      $set.passwordHash = await hashPassword(String(req.body.password));
    }
    if (username === req.admin.username && ($set.active === false || $set.role === "staff")) {
      return res.status(400).json({ error: "You can't deactivate or demote your own account." });
    }
    if (!Object.keys($set).length) return res.status(400).json({ error: "Nothing to change." });
    await admins.updateOne({ _id: username }, { $set });
    if ($set.active === false || $set.passwordHash) await sessions.deleteMany({ admin: true, source: "team", username });
    res.json({ member: teamRow(await admins.findOne({ _id: username })) });
  });

  // Team members change their own password (the built-in owner's lives in the environment).
  app.post("/api/admin/password", requireAdmin, async (req, res) => {
    if (req.admin.builtIn) return res.status(400).json({ error: "The built-in owner's password is set in the server environment (ADMIN_PASSWORD)." });
    const member = await admins.findOne({ _id: req.admin.username });
    if (!(await verifyPassword(String(req.body?.current ?? ""), member.passwordHash))) return res.status(401).json({ error: "Your current password isn't right." });
    const next = String(req.body?.next ?? "");
    if (next.length < 12) return res.status(400).json({ error: "Use a password of at least 12 characters." });
    await admins.updateOne({ _id: member._id }, { $set: { passwordHash: await hashPassword(next) } });
    // Sign out other sessions of this account; this one stays.
    const token = readCookie(req, ADMIN_COOKIE);
    await sessions.deleteMany({ admin: true, source: "team", username: member._id, hash: { $ne: sha256(token).toString("hex") } });
    res.json({ ok: true });
  });

  // ---------- Activity log ----------
  app.get("/api/admin/activity", requireAdmin, requireOwner, async (req, res) => {
    const filter = {};
    if (req.query.admin) filter.admin = String(req.query.admin);
    if (req.query.action) filter.action = { $regex: `^${String(req.query.action).replace(/[^a-z._]/g, "")}` };
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    const entries = await audit.find(filter).sort({ at: -1 }).limit(limit).toArray();
    const people = await audit.distinct("admin");
    res.json({ entries: entries.map(({ _id, ...e }) => e), admins: people.filter(Boolean) });
  });

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
