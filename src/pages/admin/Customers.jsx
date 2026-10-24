import { useState } from "react";
import { formatINR } from "../../data/catalog.js";
import { PageHeader, Loading, useAdminData, fmtDateTime } from "./ui.jsx";

export default function Customers() {
  const state = useAdminData("/api/admin/customers");
  const [q, setQ] = useState("");
  const list = (state.data?.customers ?? []).filter((c) => `${c.name} ${c.email} ${c.serials.join(" ")}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone with a RUBIIK account, with what they've bought." />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or serial…" className="field mb-6 max-w-sm !py-2 text-sm" />
      <Loading state={state} empty={!state.loading && !list.length ? "No customers yet." : null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                {["Customer", "Joined", "Orders", "Pieces", "Spent", "Serials"].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    {c.name}
                    <span className="block text-xs text-ivory-mute">{c.email}</span>
                  </td>
                  <td className="px-4 py-3 text-ivory-mute">{fmtDateTime(c.createdAt)}</td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3">{c.pieces}</td>
                  <td className="px-4 py-3">{formatINR(c.spent)}</td>
                  <td className="px-4 py-3 text-xs text-ivory-dim">{c.serials.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loading>
    </>
  );
}
