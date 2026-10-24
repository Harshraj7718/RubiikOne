// Shared building blocks for the admin dashboard.
import { useEffect, useState } from "react";

/** Fetches JSON from an admin endpoint; `reload()` fetches again. */
export function useAdminData(url) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(url)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "Couldn't load this page.");
        return d;
      })
      .then((data) => alive && setState({ data, error: "", loading: false }))
      .catch((err) => alive && setState({ data: null, error: err.message, loading: false }));
    return () => {
      alive = false;
    };
  }, [url, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ivory/10 pb-6">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ivory-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className = "", right }) {
  return (
    <section className={`border border-ivory/10 bg-night-800/70 p-5 sm:p-6 ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[11px] uppercase tracking-[0.25em] text-gold">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <Panel>
      <p className="text-[10px] uppercase tracking-[0.25em] text-ivory-mute">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-ivory-dim">{hint}</p>}
    </Panel>
  );
}

const STATUS_STYLE = {
  paid: "border-emerald-400/40 text-emerald-300",
  pending_payment: "border-gold/50 text-gold-light",
  expired: "border-ivory/20 text-ivory-mute",
};
const STATUS_LABEL = { paid: "Paid", pending_payment: "Awaiting payment", expired: "Expired" };
export function StatusBadge({ status }) {
  return <span className={`inline-block whitespace-nowrap border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${STATUS_STYLE[status] ?? "border-ivory/20"}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function Loading({ state, empty, children }) {
  if (state.loading && !state.data) return <p className="text-ivory-mute">Loading…</p>;
  if (state.error) return <p className="text-red-300">{state.error}</p>;
  if (empty) return <p className="border border-dashed border-ivory/15 p-8 text-center text-ivory-mute">{empty}</p>;
  return children;
}

export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtBytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
