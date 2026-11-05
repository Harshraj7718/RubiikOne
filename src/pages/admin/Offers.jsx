// Email offers: write an offer email, preview it, send yourself a test, then send it to customer
// accounts. The server sends in small batches and never sends the same offer to anyone twice.
import { useState } from "react";
import { PageHeader, Panel, Loading, useAdminData, fmtDateTime } from "./ui.jsx";
import { LAUNCH } from "../../data/catalog.js";

const STARTER = {
  audience: "prospects",
  subject: "Your RUBIIK ONE is still waiting",
  heading: "A numbered piece, reserved for you.",
  message:
    `You created a RUBIIK account, but your watch isn't reserved yet.\n\nOnly ${LAUNCH.editionPerModel} numbered pieces of each model will ever be made, and pre-booking prices end soon. Reserve yours today, before your number goes to someone else.`,
  couponCode: "",
  ctaLabel: "Pre-book now",
  ctaTarget: "collection",
};

async function post(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? (res.status === 504 ? "The server took too long. Try again; nothing is sent twice." : "Something went wrong."));
  return data;
}

const Label = ({ children }) => <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">{children}</span>;

export default function Offers() {
  const state = useAdminData("/api/admin/campaigns");
  const d = state.data;
  const [form, setForm] = useState(STARTER);
  const [preview, setPreview] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [msg, setMsg] = useState({ busy: "", error: "", ok: "" });
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState(null); // { id, sent, failed, busy, errors, done, error }

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setPreview(null);
  };
  const audience = d?.audiences.find((a) => a.key === form.audience);

  const run = async (label, fn) => {
    setMsg({ busy: label, error: "", ok: "" });
    try {
      const ok = await fn();
      setMsg({ busy: "", error: "", ok: ok ?? "" });
    } catch (err) {
      setMsg({ busy: "", error: err.message, ok: "" });
    }
  };

  const showPreview = () =>
    run("preview", async () => {
      setPreview(await post("/api/admin/campaigns/preview", form));
    });

  const sendTest = () =>
    run("test", async () => {
      const r = await post("/api/admin/campaigns/test", { ...form, to: testTo });
      return r.mode === "log" ? `Test written to the server log (email isn't set up).` : `Test sent to ${r.to}. Check that inbox (and spam).`;
    });

  /** Keeps sending batches for one campaign until nothing is left or a batch sends nothing. */
  const sendAll = async (id) => {
    let sent = 0;
    let failed = 0;
    let errors = [];
    setProgress({ id, sent, failed, busy: true, errors });
    try {
      for (;;) {
        const r = await post(`/api/admin/campaigns/${encodeURIComponent(id)}/send`);
        sent += r.sent;
        failed += r.failed;
        errors = r.errors?.length ? r.errors : errors;
        setProgress({ id, sent, failed, busy: true, errors });
        if (r.remaining === 0 || r.sent === 0) break;
      }
      setProgress({ id, sent, failed, busy: false, errors, done: true });
    } catch (err) {
      setProgress({ id, sent, failed, busy: false, errors, error: err.message });
    }
    state.reload();
  };

  const createAndSend = () =>
    run("send", async () => {
      setConfirming(false);
      const { campaign } = await post("/api/admin/campaigns", form);
      await sendAll(campaign.id);
    });

  const busy = Boolean(msg.busy) || progress?.busy;

  return (
    <>
      <PageHeader title="Email offers" subtitle="Email customers with an account: a reminder to buy, an offer, a coupon code." />
      <Loading state={state}>
        {d && (
          <>
            {d.mode === "log" && (
              <p className="mb-6 border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-ivory-dim">
                Email isn't set up yet, so offers are only written to the server log. Add the SMTP settings first.
              </p>
            )}
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Write the offer">
                <div className="space-y-4">
                  <label className="block">
                    <Label>Send to</Label>
                    <select value={form.audience} onChange={set("audience")} className="field bg-night-800">
                      {d.audiences.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.label} ({a.count})
                        </option>
                      ))}
                    </select>
                    {d.unsubscribed > 0 && <span className="mt-1 block text-xs text-ivory-mute">{d.unsubscribed} unsubscribed {d.unsubscribed === 1 ? "person is" : "people are"} always left out.</span>}
                  </label>
                  <label className="block">
                    <Label>Subject line</Label>
                    <input value={form.subject} onChange={set("subject")} maxLength={120} className="field" />
                  </label>
                  <label className="block">
                    <Label>Heading</Label>
                    <input value={form.heading} onChange={set("heading")} maxLength={80} className="field" />
                  </label>
                  <label className="block">
                    <Label>Message (leave a blank line between paragraphs)</Label>
                    <textarea value={form.message} onChange={set("message")} rows={7} maxLength={4000} className="field resize-y" />
                    <span className="mt-1 block text-xs text-ivory-mute">Each email starts with “Dear [first name],” automatically.</span>
                  </label>
                  <label className="block">
                    <Label>Coupon code (optional)</Label>
                    <select value={form.couponCode} onChange={set("couponCode")} className="field bg-night-800">
                      <option value="">No coupon</option>
                      {d.coupons.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} · {c.label}
                          {c.note ? ` · ${c.note}` : ""}
                        </option>
                      ))}
                    </select>
                    {!d.coupons.length && <span className="mt-1 block text-xs text-ivory-mute">Create a coupon on the Coupons page to include one.</span>}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <Label>Button text</Label>
                      <input value={form.ctaLabel} onChange={set("ctaLabel")} maxLength={30} className="field" />
                    </label>
                    <label className="block">
                      <Label>Button opens</Label>
                      <select value={form.ctaTarget} onChange={set("ctaTarget")} className="field bg-night-800">
                        {d.ctaTargets.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-ivory/10 pt-4">
                    <button type="button" onClick={showPreview} disabled={busy} className="btn-ghost !px-5 !py-3">
                      {msg.busy === "preview" ? "Loading…" : "Preview"}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block min-w-[220px] flex-1">
                      <Label>Send a test to</Label>
                      <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" className="field" />
                    </label>
                    <button type="button" onClick={sendTest} disabled={busy || !testTo} className="btn-ghost !px-5 !py-3">
                      {msg.busy === "test" ? "Sending…" : "Send test"}
                    </button>
                  </div>

                  <div className="border-t border-ivory/10 pt-4">
                    {confirming ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-ivory">
                          Send to {audience?.count} {audience?.count === 1 ? "person" : "people"} now? This can't be undone.
                        </span>
                        <button type="button" onClick={createAndSend} className="btn-gold !px-5 !py-3">
                          Yes, send
                        </button>
                        <button type="button" onClick={() => setConfirming(false)} className="btn-ghost !px-5 !py-3">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirming(true)} disabled={busy || !audience?.count} className="btn-gold !px-5 !py-3">
                        {progress?.busy ? `Sending… ${progress.sent} sent` : `Send to ${audience?.count ?? 0} ${audience?.count === 1 ? "person" : "people"}`}
                      </button>
                    )}
                    <p className="mt-2 text-xs text-ivory-mute">Send yourself a test first. Brevo's free plan allows 300 emails a day; anyone not reached today can be sent the rest tomorrow from the list below.</p>
                  </div>

                  {msg.error && <p className="text-sm text-red-300">{msg.error}</p>}
                  {msg.ok && <p className="text-sm text-emerald-300">{msg.ok}</p>}
                  <Progress p={progress} />
                </div>
              </Panel>

              <Panel title="Preview">
                {preview ? (
                  <>
                    <p className="mb-3 text-sm text-ivory-dim">
                      Subject: <span className="text-ivory">{preview.subject}</span>
                    </p>
                    <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="h-[640px] w-full border border-ivory/10 bg-white" />
                  </>
                ) : (
                  <p className="text-sm text-ivory-mute">Click Preview to see the email as customers will (shown for a sample customer).</p>
                )}
              </Panel>
            </div>

            <Panel title="Sent offers" className="mt-8">
              {!d.campaigns.length ? (
                <p className="text-sm text-ivory-mute">No offers sent yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
                      <tr>
                        {["Offer", "Sent to", "Delivered", "Not yet", ""].map((h) => (
                          <th key={h} className="px-3 py-2 font-normal">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory/10">
                      {d.campaigns.map((c) => (
                        <tr key={c.id}>
                          <td className="px-3 py-3">
                            {c.subject}
                            <span className="block text-xs text-ivory-mute">
                              {fmtDateTime(c.createdAt)} · {c.createdBy}
                              {c.couponCode ? ` · coupon ${c.couponCode}` : ""}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ivory-dim">{c.audienceLabel}</td>
                          <td className="px-3 py-3">
                            {c.sent}
                            {c.failed ? <span className="block text-xs text-red-300">{c.failed} failed</span> : null}
                          </td>
                          <td className="px-3 py-3">{c.remaining}</td>
                          <td className="px-3 py-3 text-right">
                            {c.remaining > 0 && (
                              <button type="button" onClick={() => sendAll(c.id)} disabled={busy} className="btn-ghost !px-4 !py-2 text-xs">
                                {progress?.busy && progress.id === c.id ? `Sending… ${progress.sent}` : `Send to ${c.remaining} more`}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-xs text-ivory-mute">“Not yet” includes people who joined after the offer was sent. Nobody gets the same offer twice.</p>
            </Panel>
          </>
        )}
      </Loading>
    </>
  );
}

function Progress({ p }) {
  if (!p || p.busy) return null;
  return (
    <div className="text-sm">
      {p.done && (
        <p className="text-emerald-300">
          Finished: {p.sent} sent{p.failed ? `, ${p.failed} failed` : ""}.
        </p>
      )}
      {p.error && <p className="text-red-300">{p.error}</p>}
      {p.errors?.length > 0 && <p className="mt-1 text-xs text-red-300/80">{p.errors.join(" · ")}</p>}
    </div>
  );
}
