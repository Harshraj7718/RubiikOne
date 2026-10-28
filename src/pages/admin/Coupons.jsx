// Coupons: admins create discount codes that customers can enter at checkout.
// Every code is checked again by the server when an order is placed, so the discount can't be faked.
import { useState } from "react";
import { PageHeader, Panel, Loading, useAdminData, fmtDateTime } from "./ui.jsx";
import { formatINR, unitPrice, couponDiscount, PRODUCTS } from "../../data/catalog.js";

const EMPTY = { code: "", type: "percent", value: "", maxUses: "", expiresAt: "", note: "" };

async function send(url, method, body) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export default function Coupons() {
  const state = useAdminData("/api/admin/coupons");
  const list = state.data?.coupons ?? [];
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState({ busy: false, error: "", created: "" });
  const [rowError, setRowError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // Preview what the coupon does to one pre-booked watch, so the admin sees the real effect.
  const sample = PRODUCTS[0];
  const samplePrice = unitPrice(sample, "prebook");
  const sampleOff = Number(form.value) >= 1 ? couponDiscount({ type: form.type, value: Math.floor(Number(form.value)) }, samplePrice) : 0;

  const create = async (e) => {
    e.preventDefault();
    setMsg({ busy: true, error: "", created: "" });
    try {
      // The date input gives a calendar day; the code stays valid until the end of that day (IST).
      const expiresAt = form.expiresAt ? `${form.expiresAt}T23:59:59+05:30` : "";
      const { coupon } = await send("/api/admin/coupons", "POST", { ...form, expiresAt });
      setForm(EMPTY);
      setMsg({ busy: false, error: "", created: coupon.code });
      state.reload();
    } catch (err) {
      setMsg({ busy: false, error: err.message, created: "" });
    }
  };

  const act = async (fn) => {
    setRowError("");
    try {
      await fn();
      state.reload();
    } catch (err) {
      setRowError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Coupons" subtitle="Create discount codes for customers to enter at checkout. They apply on top of the pre-booking price." />

      <Panel title="New coupon" className="mb-8">
        <form onSubmit={create} className="grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Code</span>
            <input value={form.code} onChange={set("code")} placeholder="Leave empty to generate one" className="field uppercase placeholder:normal-case" maxLength={20} />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Discount type</span>
            <select value={form.type} onChange={set("type")} className="field bg-night-800">
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off (₹)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">{form.type === "percent" ? "Percentage (1–90)" : "Amount in ₹"}</span>
            <input type="number" required min={1} max={form.type === "percent" ? 90 : 100000} value={form.value} onChange={set("value")} className="field" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Usage limit (optional)</span>
            <input type="number" min={1} value={form.maxUses} onChange={set("maxUses")} placeholder="Unlimited" className="field" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Valid until (optional)</span>
            <input type="date" value={form.expiresAt} onChange={set("expiresAt")} className="field [color-scheme:dark]" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Note (optional)</span>
            <input value={form.note} onChange={set("note")} placeholder="e.g. Influencer launch campaign" className="field" maxLength={80} />
          </label>
          <div className="flex flex-wrap items-center gap-5 md:col-span-2 xl:col-span-3">
            <button className="btn-gold !px-6 !py-3" disabled={msg.busy}>
              {msg.busy ? "Creating…" : "Create coupon"}
            </button>
            {sampleOff > 0 && (
              <p className="text-sm text-ivory-dim">
                On one {sample.edition} at the pre-booking price ({formatINR(samplePrice)}): −{formatINR(sampleOff)} → customer pays{" "}
                <span className="text-ivory">{formatINR(samplePrice - sampleOff)}</span>
              </p>
            )}
            {msg.created && (
              <p className="text-sm text-emerald-300">
                Created <span className="font-mono">{msg.created}</span>
              </p>
            )}
            {msg.error && <p className="text-sm text-red-300">{msg.error}</p>}
          </div>
        </form>
      </Panel>

      {rowError && <p className="mb-4 text-sm text-red-300">{rowError}</p>}
      <Loading state={state} empty={!state.loading && !list.length ? "No coupons yet. Create one above." : null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                <th className="px-4 py-3 font-normal">Code</th>
                <th className="px-4 py-3 font-normal">Discount</th>
                <th className="px-4 py-3 font-normal">Used</th>
                <th className="px-4 py-3 font-normal">Given away</th>
                <th className="px-4 py-3 font-normal">Valid until</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {list.map((c) => {
                const status = !c.active ? "Paused" : c.expired ? "Expired" : c.maxUses && c.used + c.held >= c.maxUses ? "Used up" : "Active";
                return (
                  <tr key={c.code}>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        title="Copy code"
                        onClick={() => navigator.clipboard?.writeText(c.code)}
                        className="font-mono text-gold-light hover:text-gold"
                      >
                        {c.code}
                      </button>
                      {c.note && <p className="mt-0.5 text-xs text-ivory-mute">{c.note}</p>}
                    </td>
                    <td className="px-4 py-3">{c.label}</td>
                    <td className="px-4 py-3">
                      {c.used}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                      {c.held > 0 && <span className="block text-xs text-ivory-mute">+{c.held} awaiting payment</span>}
                    </td>
                    <td className="px-4 py-3">{formatINR(c.discountGiven)}</td>
                    <td className="px-4 py-3 text-ivory-mute">{c.expiresAt ? fmtDateTime(c.expiresAt) : "No expiry"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${
                          status === "Active" ? "border-emerald-400/40 text-emerald-300" : "border-ivory/20 text-ivory-mute"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-[11px] uppercase tracking-[0.15em]">
                      <button
                        className="text-ivory-dim hover:text-gold"
                        onClick={() => act(() => send(`/api/admin/coupons/${encodeURIComponent(c.code)}`, "PATCH", { active: !c.active }))}
                      >
                        {c.active ? "Pause" : "Resume"}
                      </button>
                      {!c.everUsed && (
                        <button
                          className="ml-4 text-ivory-dim hover:text-red-300"
                          onClick={() => window.confirm(`Delete coupon ${c.code}?`) && act(() => send(`/api/admin/coupons/${encodeURIComponent(c.code)}`, "DELETE"))}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Loading>
    </>
  );
}
