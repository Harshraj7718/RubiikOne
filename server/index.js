// Local / self-hosted entry: `npm run dev` and `npm start`. On Vercel, api/index.js uses createApp instead.
import { createApp } from "./app.js";

// API_PORT, not PORT: dev tooling often sets PORT for the Vite server.
const PORT = Number(process.env.API_PORT ?? 8787);

let built;
try {
  built = await createApp();
} catch (err) {
  console.error(`Could not connect to MongoDB: ${err.message}`);
  console.error("Check MONGODB_URI in .env and that this machine's IP is allowed in Atlas → Network Access.");
  process.exit(1);
}
const { app, store, phase, forced, paymentMode } = built;

app.listen(PORT, () => {
  console.log(`RUBIIK API on http://localhost:${PORT} — MongoDB "${store.db.databaseName}" — phase: ${phase}${forced ? " (forced)" : ""} — payments: ${paymentMode}`);
});
