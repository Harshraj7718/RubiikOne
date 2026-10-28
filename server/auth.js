// Customer accounts: scrypt password hashes, opaque session tokens in an httpOnly cookie.
// Only a SHA-256 of each session token is stored, so a leaked database can't be replayed as logins.
import { scrypt, randomBytes, timingSafeEqual, createHash, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { trySendMail } from "./mailer.js";
import { passwordResetEmail } from "./emails.js";

const scryptAsync = promisify(scrypt);
export const SESSION_COOKIE = "rbk_session";
const SESSION_DAYS = 30;
const RESET_MINUTES = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [, saltHex, keyHex] = String(stored).split("$");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const tokenHash = (token) => createHash("sha256").update(token).digest("hex");

export function readCookie(req, name) {
  for (const part of String(req.headers.cookie ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function setSessionCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`);
}

export const publicUser = (u) => (u ? { id: u._id, name: u.name, email: u.email } : null);

/** Simple fixed-window limiter for login/register attempts, keyed by IP + email. */
function createLimiter({ max, windowMs }) {
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

export function mountAuth(app, { users, sessions, resets }, { siteUrl }) {
  const limit = createLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
  const limitResets = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

  async function startSession(res, userId) {
    const token = randomBytes(32).toString("base64url");
    await sessions.insertOne({ hash: tokenHash(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000) });
    setSessionCookie(res, token, SESSION_DAYS * 86400);
  }

  /** Resolves the signed-in user for a request, or null. */
  async function currentUser(req) {
    const token = readCookie(req, SESSION_COOKIE);
    if (!token) return null;
    const session = await sessions.findOne({ hash: tokenHash(token), expiresAt: { $gt: new Date() } });
    return session ? await users.findOne({ _id: session.userId }) : null;
  }

  async function requireUser(req, res, next) {
    try {
      const user = await currentUser(req);
      if (!user) return res.status(401).json({ error: "Please sign in to continue." });
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  }

  app.post("/api/auth/register", async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!limit(`${req.ip}|${email}`)) return res.status(429).json({ error: "Too many attempts. Please wait a few minutes." });
    if (name.length < 2) return res.status(400).json({ error: "Please enter your full name.", fields: ["name"] });
    if (!EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address.", fields: ["email"] });
    if (password.length < 8) return res.status(400).json({ error: "Use at least 8 characters for your password.", fields: ["password"] });

    const user = { _id: randomUUID(), name, email, passwordHash: await hashPassword(password), createdAt: new Date() };
    try {
      await users.insertOne(user);
    } catch (err) {
      // The unique index on email makes duplicate sign-ups fail atomically.
      if (err.code === 11000) return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      throw err;
    }
    await startSession(res, user._id);
    res.status(201).json({ user: publicUser(user) });
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!limit(`${req.ip}|${email}`)) return res.status(429).json({ error: "Too many attempts. Please wait a few minutes." });
    const user = await users.findOne({ email });
    // Same message either way, so the form doesn't reveal which emails have accounts.
    if (!user || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ error: "That email and password don't match." });
    await startSession(res, user._id);
    res.json({ user: publicUser(user) });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) await sessions.deleteOne({ hash: tokenHash(token) });
    setSessionCookie(res, "", 0);
    res.json({ ok: true });
  });

  // Forgotten password: email a one-time link. The reply is the same whether or not the email has
  // an account, so this can't be used to discover who is registered.
  app.post("/api/auth/forgot", async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!limitResets(`${req.ip}|${email}`)) return res.status(429).json({ error: "Too many requests. Please wait a few minutes." });
    if (!EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address.", fields: ["email"] });
    const user = await users.findOne({ email });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      await resets.deleteMany({ userId: user._id }); // only the newest link works
      await resets.insertOne({ hash: tokenHash(token), userId: user._id, expiresAt: new Date(Date.now() + RESET_MINUTES * 60000) });
      // The token travels in the #fragment, which browsers never send to servers or in Referer headers.
      const mail = passwordResetEmail(user.name, `${siteUrl(req)}/reset-password#${token}`);
      await trySendMail({ to: user.email, ...mail });
    }
    res.json({ ok: true, message: "If an account exists for that email, a reset link is on its way. It works for 30 minutes." });
  });

  // Choose a new password with a reset link. Every existing session is signed out.
  app.post("/api/auth/reset", async (req, res) => {
    const token = String(req.body?.token ?? "");
    const password = String(req.body?.password ?? "");
    if (!limitResets(`${req.ip}|reset`)) return res.status(429).json({ error: "Too many attempts. Please wait a few minutes." });
    if (password.length < 8) return res.status(400).json({ error: "Use at least 8 characters for your password.", fields: ["password"] });
    // findOneAndDelete makes each link single-use, even if submitted twice at once.
    const reset = token && (await resets.findOneAndDelete({ hash: tokenHash(token), expiresAt: { $gt: new Date() } }));
    if (!reset) return res.status(410).json({ error: "This reset link has expired or was already used. Please request a new one." });
    await users.updateOne({ _id: reset.userId }, { $set: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() } });
    await sessions.deleteMany({ userId: reset.userId });
    await startSession(res, reset.userId);
    res.json({ user: publicUser(await users.findOne({ _id: reset.userId })) });
  });

  app.get("/api/auth/me", async (req, res) => {
    res.json({ user: publicUser(await currentUser(req)) });
  });

  return { requireUser, currentUser };
}
