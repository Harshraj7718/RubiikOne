// Outgoing email. With SMTP_HOST, SMTP_USER and SMTP_PASS set (the mailbox behind support@rubiikone.com),
// mail is sent over SMTP. Without them the store runs in log mode: each email is printed to the
// server log and kept in `outbox`, so every flow still works locally and nothing fails.
import nodemailer from "nodemailer";
import { CONTACT } from "../src/data/legal.js";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
export const MAIL_MODE = SMTP_HOST && SMTP_USER && SMTP_PASS ? "smtp" : "log";
const FROM = process.env.MAIL_FROM || `RUBIIK <${CONTACT.email}>`;

/** The last few emails in log mode (newest last), for local testing. */
export const outbox = [];

let transport;

/** Sends one email; resolves to { sent } or { logged }. Throws only if SMTP rejects it. */
export async function sendMail({ to, subject, html, text, attachments = [] }) {
  if (MAIL_MODE === "log") {
    outbox.push({ to, subject, html, text, attachments: attachments.map((a) => a.filename), at: new Date() });
    if (outbox.length > 25) outbox.shift();
    console.log(`[mail:log] to=${to} · "${subject}"${attachments.length ? ` · attached ${attachments.map((a) => a.filename).join(", ")}` : ""}`);
    return { logged: true };
  }
  const port = Number(SMTP_PORT || 465);
  // Port 465 is SMTP over TLS; 587 upgrades with STARTTLS.
  transport ??= nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transport.sendMail({ from: FROM, replyTo: CONTACT.email, to, subject, html, text, attachments });
  return { sent: true };
}

/** Sends without ever failing the caller (a missed email must not undo a payment); returns the outcome. */
export async function trySendMail(message) {
  try {
    return await sendMail(message);
  } catch (err) {
    console.error(`Email to ${message.to} failed: ${err.message}`);
    return { failed: true, error: err.message };
  }
}
