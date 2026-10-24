// Owners wall moderation: show or hide each paid order's certificate cards, and edit the display name.
import { useState } from "react";
import Certificate from "../../components/Certificate.jsx";
import { PageHeader, Loading, useAdminData } from "./ui.jsx";

export default function Wall() {
  const state = useAdminData("/api/admin/orders?status=paid");
  const list = state.data?.orders ?? [];

  return (
    <>
      <PageHeader title="Owners wall" subtitle="Cards from paid pre-orders. Hide any card from the public wall, or correct the name it shows." />
      <Loading state={state} empty={!state.loading && !list.length ? "No paid pre-orders yet. Cards appear here once payments complete." : null}>
        <div className="grid gap-6 xl:grid-cols-2">
          {list.map((o) => (
            <WallItem key={o.id} order={o} onSaved={state.reload} />
          ))}
        </div>
      </Loading>
    </>
  );
}

function WallItem({ order, onSaved }) {
  const [name, setName] = useState(order.wall?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shown = order.wall?.show;

  const save = async (show) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/wall`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show, displayName: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-ivory/10 bg-night-800/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ivory-mute">
            {order.id} · {order.customer.name}
          </p>
          <p className={`mt-1 text-[10px] uppercase tracking-[0.2em] ${shown ? "text-emerald-300" : "text-ivory-mute"}`}>{shown ? "Shown on the wall" : "Hidden from the wall"}</p>
        </div>
        <button onClick={() => save(!shown)} disabled={busy} className={shown ? "btn-ghost !px-4 !py-2" : "btn-gold !px-4 !py-2"}>
          {shown ? "Hide" : "Show"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Name on the wall</span>
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className="field !py-2 text-sm" />
        </label>
        <button onClick={() => save(true)} disabled={busy || name.trim().length < 2} className="btn-ghost !px-4 !py-2">
          Save name
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <div className={`mt-5 flex flex-wrap gap-4 ${shown ? "" : "opacity-50"}`}>
        {order.certificates.map((c) => (
          <Certificate key={c.serial} cert={c} name={order.wall?.displayName || c.ownerName} size="sm" />
        ))}
      </div>
    </div>
  );
}
