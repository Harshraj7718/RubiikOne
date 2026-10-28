import { useState } from "react";
import { PageHeader, Panel, Loading, useAdminData, fmtDateTime } from "./ui.jsx";
import { LAUNCH, formatDate } from "../../data/catalog.js";

export default function Waitlist() {
  const state = useAdminData("/api/admin/waitlist");
  const list = state.data?.waitlist ?? [];

  return (
    <>
      <PageHeader
        title="Waitlist"
        subtitle={`${list.length} ${list.length === 1 ? "person" : "people"} asked to hear when pre-booking opens.`}
        actions={
          <a href="/api/admin/waitlist.csv" className="btn-ghost !px-5 !py-3">
            Export CSV
          </a>
        }
      />
      <LaunchEmail />
      <Loading state={state} empty={!state.loading && !list.length ? "No one has joined the waitlist yet." : null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {list.map((w) => (
                <tr key={w.email}>
                  <td className="px-4 py-3">{w.email}</td>
                  <td className="px-4 py-3 text-ivory-mute">{fmtDateTime(w.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loading>
    </>
  );
}

/**
 * Sends the launch announcement to every pre-order owner and everyone on the waitlist, once each.
 * The server sends in small batches; this keeps asking until nothing is left.
 */
function LaunchEmail() {
  const info = useAdminData("/api/admin/emails/launch");
  const [confirming, setConfirming] = useState(false);
  const [run, setRun] = useState({ busy: false, sent: 0, failed: 0, error: "", done: false });
  const d = info.data;
  const pending = d ? d.total - d.sent : 0;

  const send = async () => {
    setConfirming(false);
    setRun({ busy: true, sent: 0, failed: 0, error: "", done: false });
    let sent = 0;
    let failed = 0;
    try {
      for (;;) {
        const res = await fetch("/api/admin/emails/launch", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Sending stopped.");
        sent += data.sent;
        failed = data.failed;
        setRun({ busy: true, sent, failed, error: "", done: false });
        // Stop when everything is sent, or when a whole batch failed (retrying wouldn't help).
        if (data.remaining === 0 || data.sent === 0) break;
      }
      setRun({ busy: false, sent, failed, error: "", done: true });
    } catch (err) {
      setRun({ busy: false, sent, failed, error: err.message, done: false });
    }
    info.reload();
  };

  return (
    <Panel title="Launch email" className="mb-8">
      {!d ? (
        <p className="text-sm text-ivory-mute">{info.error || "Loading…"}</p>
      ) : (
        <div className="space-y-4 text-sm text-ivory-dim">
          <p>
            Announces the launch on {formatDate(LAUNCH.launch, { year: "numeric" })} to {d.owners} pre-order {d.owners === 1 ? "owner" : "owners"} and {d.total - d.owners} waitlist{" "}
            {d.total - d.owners === 1 ? "email" : "emails"}. Each person gets it once. <span className="text-ivory">{d.sent}</span> sent so far,{" "}
            <span className="text-ivory">{pending}</span> waiting.
          </p>
          {d.mode === "log" && (
            <p className="border border-gold/30 bg-gold/5 px-4 py-3 text-ivory-dim">
              SMTP isn't set up yet, so emails are printed to the server log instead of being delivered. Add SMTP_HOST, SMTP_USER and SMTP_PASS first.
            </p>
          )}
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-ivory">Send to {pending} {pending === 1 ? "person" : "people"} now?</span>
              <button type="button" onClick={send} className="btn-gold !px-5 !py-3">
                Yes, send
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn-ghost !px-5 !py-3">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={run.busy || pending === 0} className="btn-gold !px-5 !py-3">
              {run.busy ? `Sending… ${run.sent} sent` : pending === 0 ? "Everyone has it" : "Send launch email"}
            </button>
          )}
          {run.done && (
            <p className="text-emerald-300">
              Finished: {run.sent} {d.mode === "log" ? "logged" : "sent"}
              {run.failed ? `, ${run.failed} failed` : ""}.
            </p>
          )}
          {run.error && <p className="text-red-300">{run.error}</p>}
        </div>
      )}
    </Panel>
  );
}
