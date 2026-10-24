// Vercel serverless function: every /api/* request is routed here (see vercel.json) and handled by
// the same Express app as the local server. The app and its MongoDB connection are created once per
// function instance and reused across requests while the instance stays warm.
import { createApp } from "../server/app.js";

let ready;

export default async function handler(req, res) {
  try {
    ready ??= createApp({ serveClient: false });
    const { app } = await ready;
    return app(req, res);
  } catch (err) {
    // Let the next request retry the connection instead of caching the failure.
    ready = undefined;
    console.error("API startup failed:", err.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "The store is temporarily unavailable. Please try again shortly." }));
  }
}
