// MongoDB connection, collections and indexes.
// Reads MONGODB_URI (required) and MONGODB_DB (defaults to "rubiik") from the environment.
import { MongoClient } from "mongodb";
import dns from "node:dns";

/**
 * mongodb+srv:// needs a DNS SRV lookup. Some setups (local DNS proxies, VPNs, some ISPs on Windows)
 * refuse SRV queries from Node even though the OS resolves them. If that happens, retry the lookup
 * through public resolvers (or MONGODB_DNS, comma-separated). Only Node's dns.resolve* calls are
 * affected; ordinary connections still use the system resolver.
 */
async function ensureSrvResolvable(uri) {
  if (!uri.startsWith("mongodb+srv://")) return;
  const host = new URL(uri.replace("mongodb+srv://", "https://")).hostname;
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  } catch (err) {
    const fallback = (process.env.MONGODB_DNS || "1.1.1.1,8.8.8.8").split(",").map((s) => s.trim());
    console.warn(`DNS SRV lookup failed (${err.code}); retrying through ${fallback.join(", ")}.`);
    dns.setServers(fallback);
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  }
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env and add your connection string.");
  await ensureSrvResolvable(uri);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, appName: "rubiik-store" });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "rubiik");

  const users = db.collection("users"); // _id = account id
  const sessions = db.collection("sessions"); // { hash, userId, expiresAt }
  const orders = db.collection("orders"); // _id = order id, e.g. RBK-1A2B3C4D
  const waitlist = db.collection("waitlist"); // { email, at }
  const meta = db.collection("meta"); // { _id: "edition" | "serialSecret", ... }

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    sessions.createIndex({ hash: 1 }, { unique: true }),
    // MongoDB deletes expired sessions on its own.
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    orders.createIndex({ userId: 1, createdAt: -1 }),
    orders.createIndex({ status: 1, holdUntil: 1 }),
    waitlist.createIndex({ email: 1 }, { unique: true }),
  ]);

  /** Runs `fn(session)` in a transaction, retrying on transient conflicts. */
  async function withTransaction(fn) {
    const session = client.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  return { client, db, users, sessions, orders, waitlist, meta, withTransaction };
}
