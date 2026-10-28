// Activity log (owners only): who signed in and what every admin changed, exported or opened.
import { useState } from "react";
import { PageHeader, Loading, useAdminData, fmtDateTime } from "./ui.jsx";

// Plain-language names for the logged actions.
const ACTIONS = {
  login: "Signed in",
  "login.failed": "Failed sign-in",
  logout: "Signed out",
  "coupon.create": "Created coupon",
  "coupon.pause": "Paused coupon",
  "coupon.resume": "Resumed coupon",
  "coupon.delete": "Deleted coupon",
  "wall.update": "Edited owners wall card",
  "order.dispatch": "Dispatched order",
  "document.receipt": "Opened receipt voucher",
  "document.invoice": "Opened tax invoice",
  "export.orders": "Exported orders CSV",
  "export.waitlist": "Exported waitlist CSV",
  "email.launch": "Sent launch emails",
  "team.add": "Added team member",
  "team.update": "Changed team member",
  "account.password": "Changed own password",
};
const FILTERS = [
  ["", "Everything"],
  ["login", "Sign-ins"],
  ["order", "Orders"],
  ["coupon", "Coupons"],
  ["document", "Documents"],
  ["export", "Exports"],
  ["team", "Team"],
  ["email", "Emails"],
];

const detailText = (d) =>
  d
    ? Object.entries(d)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" · ")
    : "";

export default function Activity() {
  const [action, setAction] = useState("");
  const [admin, setAdmin] = useState("");
  const state = useAdminData(`/api/admin/activity?${new URLSearchParams({ action, admin })}`);
  const entries = state.data?.entries ?? [];

  return (
    <>
      <PageHeader title="Activity" subtitle="Every admin sign-in, change, export and document opened, newest first (latest 200)." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setAction(value)}
            className={`border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] ${action === value ? "border-gold text-gold" : "border-ivory/15 text-ivory-mute hover:text-ivory"}`}
          >
            {label}
          </button>
        ))}
        <select id="activity-admin" value={admin} onChange={(e) => setAdmin(e.target.value)} className="field ml-auto w-auto bg-night-900 !py-1.5 text-sm" aria-label="Filter by person">
          <option value="">All people</option>
          {(state.data?.admins ?? []).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <Loading state={state} empty={!state.loading && !entries.length ? "Nothing recorded yet." : null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                <th className="px-4 py-3 font-normal">When</th>
                <th className="px-4 py-3 font-normal">Who</th>
                <th className="px-4 py-3 font-normal">What</th>
                <th className="px-4 py-3 font-normal">On</th>
                <th className="px-4 py-3 font-normal">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {entries.map((e, i) => (
                <tr key={i} className={e.action === "login.failed" ? "bg-red-500/5" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 text-ivory-mute">{fmtDateTime(e.at)}</td>
                  <td className="px-4 py-3">
                    {e.admin ?? <span className="text-ivory-mute">unknown</span>}
                    {e.role && <span className="block text-xs capitalize text-ivory-mute">{e.role}</span>}
                  </td>
                  <td className={`px-4 py-3 ${e.action === "login.failed" ? "text-red-300" : ""}`}>{ACTIONS[e.action] ?? e.action}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.target ?? ""}</td>
                  <td className="max-w-[320px] break-words px-4 py-3 text-xs text-ivory-dim">
                    {detailText(e.details)}
                    {e.ip && <span className="block text-ivory-mute">IP {e.ip}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loading>
    </>
  );
}
