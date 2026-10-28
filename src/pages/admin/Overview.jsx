import { Link } from "react-router-dom";
import { formatINR } from "../../data/catalog.js";
import { useShop } from "../../lib/shop.jsx";
import { PageHeader, Panel, Stat, StatusBadge, Loading, useAdminData, fmtDateTime } from "./ui.jsx";

export default function Overview() {
  const state = useAdminData("/api/admin/overview");
  const { phase } = useShop();
  const d = state.data;

  return (
    <>
      <PageHeader title="Overview" subtitle={`Store phase: ${phase === "teaser" ? "before pre-booking" : phase === "prebook" ? "pre-booking open" : "launched"}`} />
      <Loading state={state}>
        {d && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Pieces sold" value={`${d.edition.sold} / ${d.edition.total}`} hint={`${d.edition.perModel} per model · ${d.edition.held} held · ${d.edition.remaining} available`} />
              <Stat label="Revenue (paid)" value={formatINR(d.revenue.paid)} hint={d.revenue.pending ? `${formatINR(d.revenue.pending)} awaiting payment` : "Nothing awaiting payment"} />
              <Stat label="Customers" value={d.counts.customers} hint={`${d.counts.paidOrders} paid order${d.counts.paidOrders === 1 ? "" : "s"}`} />
              <Stat label="Waitlist" value={d.counts.waitlist} hint={`${d.counts.onWall} order${d.counts.onWall === 1 ? "" : "s"} shown on the owners wall`} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="The edition">
                {/* One edition of 200 per model: sold, held awaiting payment, and what's left */}
                <div className="space-y-6">
                  {d.byModel.map((m) => (
                    <div key={m.slug}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-ivory">
                          <span className="h-2 w-2 rounded-full" style={{ background: m.accent }} />
                          {m.edition}
                        </span>
                        <span className="tabular-nums text-ivory-dim">
                          <span className="font-serif text-2xl text-ivory">{m.paid}</span> sold · {m.held} held · {m.remaining} left of {m.total}
                        </span>
                      </div>
                      <div className="mt-2 flex h-3 w-full overflow-hidden bg-ivory/10">
                        <div style={{ width: `${(m.paid / m.total) * 100}%`, background: m.accent }} />
                        <div className="bg-gold/40" style={{ width: `${(m.held / m.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Pieces sold · last 14 days">
                <Daily days={d.daily} />
              </Panel>
            </div>

            <Panel title="Recent orders" right={<Link to="/admin/orders" className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute hover:text-gold">All orders →</Link>}>
              {d.recent.length === 0 ? (
                <p className="text-ivory-mute">No orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <tbody className="divide-y divide-ivory/10">
                      {d.recent.map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 pr-4 font-sans text-xs text-ivory-dim">{o.id}</td>
                          <td className="py-3 pr-4">{o.customer.name}</td>
                          <td className="py-3 pr-4 text-ivory-dim">{o.items.map((i) => `${i.qty}× ${i.name.replace("RUBIIK ONE ", "")}`).join(", ")}</td>
                          <td className="py-3 pr-4">{formatINR(o.total)}</td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="py-3 text-right text-ivory-mute">{fmtDateTime(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        )}
      </Loading>
    </>
  );
}

function Daily({ days }) {
  const max = Math.max(1, ...days.map((d) => d.pieces));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {days.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div className="bg-gold w-full transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(d.pieces ? 6 : 1, (d.pieces / max) * 100)}%`, opacity: d.pieces ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-ivory opacity-0 group-hover:opacity-100">{d.pieces}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ivory-mute">
        <span>{new Date(days[0].day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
