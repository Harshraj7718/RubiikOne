// Outgoing email. With SMTP_HOST, SMTP_USER and SMTP_PASS set (the mailbox behind support@rubiikone.com),
// mail is sent over SMTP. Without them the store runs in log mode: each email is printed to the
// server log and kept in `outbox`, so every flow still works locally and nothing fails.
import nodemailer from "nodemailer";
import { waitUntil } from "@vercel/functions";
import { CONTACT } from "../src/data/legal.js";

// Cleaned up: a value pasted into Vercel's dashboard often carries a stray space, newline or quotes.
const [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS] = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].map((k) => process.env[k]?.trim().replace(/^(["'])(.*)$/, "$2"));
export const MAIL_MODE = SMTP_HOST && SMTP_USER && SMTP_PASS ? "smtp" : "log";
const FROM = process.env.MAIL_FROM || `RUBIIK <${CONTACT.email}>`;

/** The last few emails in log mode (newest last), for local testing. */
export const outbox = [];

let transport;

function smtp() {
  const port = Number(SMTP_PORT || 465);
  // Port 465 is SMTP over TLS; 587 upgrades with STARTTLS. Short timeouts: a mail server that hangs
  // must give up well inside the function's time limit (vercel.json maxDuration), so the outcome is
  // still recorded on the order.
  return (transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  }));
}

/** Connects and logs in to the mail server without sending anything; for the admin "check" button. */
export async function checkMail() {
  if (MAIL_MODE === "log") return { ok: false, mode: MAIL_MODE, error: "SMTP_HOST, SMTP_USER and SMTP_PASS are not all set, so emails only go to the server log." };
  try {
    await smtp().verify();
    return { ok: true, mode: MAIL_MODE, server: mailServer() };
  } catch (err) {
    return { ok: false, mode: MAIL_MODE, server: mailServer(), error: err.message };
  }
}

/** Sends one email; resolves to { sent } or { logged }. Throws only if SMTP rejects it. */
export async function sendMail({ to, subject, html, text, attachments = [] }) {
  if (MAIL_MODE === "log") {
    outbox.push({ to, subject, html, text, attachments: attachments.map((a) => a.filename), at: new Date() });
    if (outbox.length > 25) outbox.shift();
    console.log(`[mail:log] to=${to} · "${subject}"${attachments.length ? ` · attached ${attachments.map((a) => a.filename).join(", ")}` : ""}`);
    return { logged: true };
  }
  await smtp().sendMail({ from: FROM, replyTo: CONTACT.email, to, subject, html, text, attachments });
  return { sent: true };
}

/** What's stored on an order about one email: when, how, and the mail server's reason if it failed. */
export const mailRecord = (result) => ({
  at: new Date(),
  mode: MAIL_MODE,
  ok: !result.failed,
  ...(result.failed && { error: String(result.error).slice(0, 300), server: mailServer() }),
});

/** Where mail is sent from, for diagnosing failures (never includes the password). */
export const mailServer = () => (MAIL_MODE === "smtp" ? `${SMTP_USER} @ ${SMTP_HOST}:${Number(SMTP_PORT || 465)}` : null);

/** Sends without ever failing the caller (a missed email must not undo a payment); returns the outcome. */
export async function trySendMail(message) {
  try {
    return await sendMail(message);
  } catch (err) {
    console.error(`Email to ${message.to} failed: ${err.message}`);
    return { failed: true, error: err.message };
  }
}

/**
 * Runs `task` after the reply has gone to the browser, so a slow mail server never holds up the page.
 * On Vercel, waitUntil keeps the function alive until the task finishes; locally it simply runs.
 */
export function inBackground(task) {
  const run = Promise.resolve()
    .then(task)
    .catch((err) => console.error(`Background task failed: ${err.message}`));
  waitUntil(run);
  return run;
}
