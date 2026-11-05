import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "../../data/catalog.js";
import Certificate from "../../components/Certificate.jsx";
import { PageHeader, StatusBadge, Loading, useAdminData, fmtDateTime } from "./ui.jsx";


function DocLinks({ label, href }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-ivory-mute">{label}</span>
      <a href={href} target="_blank" rel="noreferrer" className="text-ivory-dim hover:text-gold">
        View
      </a>
      <a href={`${href}?download=1`} className="text-gold hover:text-gold-light">
        Download PDF
      </a>
    </div>
  );
}

const DISPATCH_NOTE = {
  sent: "and emailed to the customer",
  logged: "(the email went to the server log, because SMTP isn't set up yet)",
  failed: "but the email failed to send",
};

/** Mark a paid order as dispatched: issues the tax invoice and emails it with the tracking details. */
function Dispatch({ order: o, onChanged }) {
  const [form, setForm] = useState({ courier: o.dispatch?.courier ?? "", tracking: o.dispatch?.tracking ?? "" });
  const [state, setState] = useState({ busy: false, error: "", done: "" });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: "", done: "" });
    try {
      const res = await fetch(`/api/admin/orders/${o.id}/dispatch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't mark this order as dispatched.");
      setState({ busy: false, error: "", done: `Tax invoice ${data.invoiceNumber} issued ${DISPATCH_NOTE[data.email]}.` });
      const sent = data.email !== "failed";
      onChanged({
        invoiceNumber: data.invoiceNumber,
        dispatch: { at: o.dispatch?.at ?? new Date().toISOString(), ...form },
        emails: { ...o.emails, dispatch: { at: new Date().toISOString(), mode: data.email === "sent" ? "smtp" : "log", ok: sent } },
        unsentEmails: [...(o.unsentEmails ?? []).filter((k) => k !== "dispatch"), ...(sent ? [] : ["dispatch"])],
      });
    } catch (err) {
      setState({ busy: false, error: err.message, done: "" });
    }
  };
  return (
    <form onSubmit={submit} className="mt-8 border border-ivory/10 bg-night-900/50 p-5">
      <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{o.dispatch ? `Dispatched ${fmtDateTime(o.dispatch.at)}` : "Dispatch"}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ivory-mute">Courier</span>
          <input id={`courier-${o.id}`} className="field" value={form.courier} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} placeholder="e.g. Blue Dart" maxLength={60} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ivory-mute">Tracking number</span>
          <input id={`tracking-${o.id}`} className="field" value={form.tracking} onChange={(e) => setForm((f) => ({ ...f, tracking: e.target.value }))} maxLength={60} />
        </label>
      </div>
      <button className="btn-gold mt-5 !px-5 !py-3" disabled={state.busy}>
        {state.busy ? "Saving…" : o.dispatch ? "Update and re-send email" : "Mark dispatched & email invoice"}
      </button>
      {state.done && <p className="mt-3 text-sm text-emerald-300">{state.done}</p>}
      {state.error && <p className="mt-3 text-sm text-red-300">{state.error}</p>}
    </form>
  );
}

const EMAILS = {
  confirmation: { label: "Order confirmation", note: "with the receipt" },
  dispatch: { label: "Dispatch email", note: "with tracking and the tax invoice" },
};
/** The message for a failed request that came back without one, e.g. a hosting timeout. */
const httpError = (res, fallback) => (res.status === 504 ? "The server ran out of time while the mail server was responding. Try again." : `${fallback} (error ${res.status})`);

const mailStatus = (m) => (!m ? "Not sent yet" : !m.ok ? `Failed · ${fmtDateTime(m.at)}${m.error ? ` · ${m.error}` : ""}` : m.mode === "smtp" ? `Sent · ${fmtDateTime(m.at)}` : `Logged only · ${fmtDateTime(m.at)}`);

/** The order's customer emails, each with a button to send it by hand if it didn't go out on its own. */
function Emails({ order: o, onChanged }) {
  const [state, setState] = useState({ busy: "", error: "", done: "" });
  const send = async (kind) => {
    setState({ busy: kind, error: "", done: "" });
    try {
      const res = await fetch(`/api/admin/orders/${o.id}/emails/${kind}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? httpError(res, "Couldn't send the email."));
      const record = { at: new Date().toISOString(), mode: data.email === "sent" ? "smtp" : "log", ok: data.email !== "failed" };
      onChanged({ emails: { ...o.emails, [kind]: record }, unsentEmails: data.email === "failed" ? o.unsentEmails : (o.unsentEmails ?? []).filter((k) => k !== kind) });
      if (data.email === "failed") throw new Error(`The email failed to send${data.error ? `: ${data.error}` : "."}`);
      setState({ busy: "", error: "", done: data.email === "sent" ? `${EMAILS[kind].label} sent to ${o.customer.email}.` : "The email went to the server log, because SMTP isn't set up yet." });
    } catch (err) {
      setState({ busy: "", error: err.message, done: "" });
    }
  };
  const kinds = o.dispatch ? ["confirmation", "dispatch"] : ["confirmation"];
  return (
    <div className="mt-8 border border-ivory/10 bg-night-900/50 p-5">
      <p className="text-[11px] uppercase tracking-[0.25em] text-gold">Customer emails</p>
      <ul className="mt-4 divide-y divide-ivory/10 text-sm">
        {kinds.map((kind) => {
          const m = o.emails?.[kind];
          const unsent = o.unsentEmails?.includes(kind);
          return (
            <li key={kind} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p>{EMAILS[kind].label} <span className="text-ivory-mute">· {EMAILS[kind].note}</span></p>
                <p className={`mt-0.5 text-xs ${unsent ? "text-red-300" : "text-ivory-mute"}`}>{mailStatus(m)}</p>
              </div>
              <button type="button" onClick={() => send(kind)} disabled={Boolean(state.busy)} className={`${unsent ? "btn-gold" : "btn-ghost"} !px-4 !py-2 text-[10px] disabled:opacity-50`}>
                {state.busy === kind ? "Sending…" : unsent ? "Send now" : "Re-send"}
              </button>
            </li>
          );
        })}
      </ul>
      {state.done && <p className="mt-3 text-sm text-emerald-300">{state.done}</p>}
      {state.error && <p className="mt-3 text-sm text-red-300">{state.error}</p>}
    </div>
  );
}

/** Logs in to the mail server without sending anything, and shows the result. */
function CheckMail() {
  const [state, setState] = useState({ busy: false, result: null });
  const check = async () => {
    setState({ busy: true, result: null });
    const res = await fetch("/api/admin/emails/check", { method: "POST" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) ?? { ok: false, error: "Couldn't reach the server." };
    setState({ busy: false, result: data });
  };
  const r = state.result;
  return (
    <div className="text-right">
      <button type="button" onClick={check} disabled={state.busy} className="btn-ghost !px-5 !py-3 disabled:opacity-50">
        {state.busy ? "Checking…" : "Check email settings"}
      </button>
      {r && (
        <p className={`mt-2 max-w-sm text-xs ${r.ok ? "text-emerald-300" : "text-red-300"}`}>
          {r.ok ? `Connected and logged in as ${r.server}.` : `${r.server ? `${r.server}: ` : ""}${r.error}`}
        </p>
      )}
    </div>
  );
}

/** Sends every email that hasn't gone out, in batches, until none are left or one fails. */
function SendUnsent({ count, onDone }) {
  const [state, setState] = useState({ busy: false, msg: "", error: "" });
  const run = async () => {
    if (!window.confirm(`Send ${count} unsent email${count === 1 ? "" : "s"} to customers now?`)) return;
    setState({ busy: true, msg: "", error: "" });
    let sent = 0;
    try {
      for (;;) {
        const res = await fetch("/api/admin/emails/unsent", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? httpError(res, "Couldn't send the emails."));
        sent += data.sent;
        setState({ busy: true, msg: `${sent} sent…`, error: "" });
        if (data.failed) throw new Error(`${data.failed} failed (${data.failures.map((f) => `${f.id} ${f.kind}`).join(", ")}): ${data.failures[0].error}`);
        if (!data.remaining || !data.sent) break;
      }
      setState({ busy: false, msg: `${sent} email${sent === 1 ? "" : "s"} sent.`, error: "" });
    } catch (err) {
      setState({ busy: false, msg: sent ? `${sent} sent.` : "", error: err.message });
    }
    onDone();
  };
  if (!count && !state.msg && !state.error) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 border border-red-300/30 bg-red-300/5 px-4 py-3 text-sm">
      {count > 0 && (
        <>
          <span>
            {count} paid order{count === 1 ? " has an" : "s have"} email that didn’t reach the customer.
          </span>
          <button type="button" onClick={run} disabled={state.busy} className="btn-gold !px-4 !py-2 text-[10px] disabled:opacity-50">
            {state.busy ? "Sending…" : "Send all unsent emails"}
          </button>
        </>
      )}
      {state.msg && <span className="text-emerald-300">{state.msg}</span>}
      {state.error && <span className="text-red-300">{state.error}</span>}
    </div>
  );
}

const FILTERS = [
  ["all", "All"],
  ["paid", "Paid"],
  ["pending_payment", "Awaiting payment"],
  ["expired", "Expired"],
  ["unsent", "Emails not sent"],
];

export default function Orders() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const query = new URLSearchParams({ status, q }).toString();
  const state = useAdminData(`/api/admin/orders?${query}`);
  const list = state.data?.orders ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every pre-order, its payment status and the certificates it issued."
        actions={
          <div className="flex flex-wrap items-start gap-3">
            <CheckMail />
            <a href={`/api/admin/orders.csv?${query}`} className="btn-ghost !px-5 !py-3">
              Export CSV
            </a>
          </div>
        }
      />
      <SendUnsent count={state.data?.unsent ?? 0} onDone={state.reload} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 border border-ivory/10 p-1">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${status === value ? "bg-gold text-night" : "text-ivory/60 hover:text-ivory"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, order, serial…" className="field max-w-sm flex-1 !py-2 text-sm" />
      </div>

      <Loading state={state} empty={!state.loading && !list.length ? "No orders match." : null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                {["Order", "Customer", "Watches", "Total", "Status", "Created"].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {list.map((o) => (
                <tr key={o.id} onClick={() => setOpen(o)} className="cursor-pointer transition-colors hover:bg-ivory/5">
                  <td className="px-4 py-3 text-xs text-ivory-dim">{o.id}</td>
                  <td className="px-4 py-3">
                    {o.customer.name}
                    <span className="block text-xs text-ivory-mute">{o.customer.email}</span>
                  </td>
                  <td className="px-4 py-3 text-ivory-dim">{o.items.map((i) => `${i.qty}× ${i.name.replace("RUBIIK ONE ", "")}`).join(", ")}</td>
                  <td className="px-4 py-3">{formatINR(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                    {o.unsentEmails?.length > 0 && <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-red-300">Email not sent</span>}
                  </td>
                  <td className="px-4 py-3 text-ivory-mute">{fmtDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loading>

      <AnimatePresence>
        {open && (
          <OrderDrawer
            order={open}
            onClose={() => setOpen(null)}
            onChanged={(patch) => {
              setOpen((o) => ({ ...o, ...patch }));
              state.reload();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function OrderDrawer({ order: o, onClose, onChanged }) {
  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="fixed right-0 top-0 z-[61] h-full w-full max-w-xl overflow-y-auto border-l border-ivory/10 bg-night-800 p-6 sm:p-8"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        data-lenis-prevent
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-ivory-mute">{o.id}</p>
            <h2 className="mt-1 font-serif text-3xl">{o.customer.name}</h2>
            <div className="mt-2">
              <StatusBadge status={o.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute hover:text-gold">
            Close
          </button>
        </div>

        <dl className="mt-8 grid grid-cols-[110px_1fr] gap-y-3 text-sm">
          {[
            ["Email", o.customer.email],
            ["Phone", o.customer.phone],
            ["Address", `${o.customer.address}, ${o.customer.city}${o.customer.state ? `, ${o.customer.state}` : ""} ${o.customer.pincode}`],
            ["Created", fmtDateTime(o.createdAt)],
            ["Paid", o.payment?.paidAt ? fmtDateTime(o.payment.paidAt) : "—"],
            ["Payment", o.payment ? `${o.payment.provider}${o.payment.reference ? ` · ${o.payment.reference}` : ""}` : "—"],
            ["Owners wall", o.wall?.show ? `Shown as “${o.wall.displayName}”` : "Not shown"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ivory-mute">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 border-t border-ivory/10 pt-6">
          {o.items.map((i) => (
            <div key={i.slug} className="flex justify-between py-1 text-sm">
              <span>
                {i.qty}× {i.name}
              </span>
              <span>{formatINR(i.unitPrice * i.qty)}</span>
            </div>
          ))}
          {o.coupon && (
            <div className="flex justify-between py-1 text-sm text-gold-light">
              <span>
                Coupon <span className="font-mono">{o.coupon.code}</span>
              </span>
              <span>− {formatINR(o.coupon.discount)}</span>
            </div>
          )}
          {o.gst > 0 && (
            <div className="flex justify-between py-1 text-sm text-ivory-dim">
              <span>incl. GST</span>
              <span>{formatINR(o.gst)}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-ivory/10 pt-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Total</span>
            <span className="font-serif text-2xl">{formatINR(o.total)}</span>
          </div>
        </div>

        {o.status === "paid" && (
          <div className="mt-6 space-y-3 text-[11px] uppercase tracking-[0.2em]">
            <DocLinks label={`Receipt voucher ${o.receiptNumber ?? "(issued on first download)"}`} href={`/api/admin/orders/${o.id}/receipt`} />
            {o.invoiceNumber ? (
              <DocLinks label={`Tax invoice ${o.invoiceNumber}`} href={`/api/admin/orders/${o.id}/invoice`} />
            ) : (
              <p className="text-ivory-mute">Tax invoice · issued on dispatch</p>
            )}
          </div>
        )}
        {o.status === "paid" && <Emails order={o} onChanged={onChanged} />}
        {o.status === "paid" && <Dispatch order={o} onChanged={onChanged} />}

        {o.certificates.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">Certificates</p>
            {o.certificates.map((c) => (
              <Certificate key={c.serial} cert={c} name={c.ownerName} size="sm" />
            ))}
          </div>
        )}
      </motion.aside>
    </>
  );
}
