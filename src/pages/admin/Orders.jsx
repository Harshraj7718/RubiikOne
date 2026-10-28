import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "../../data/catalog.js";
import Certificate from "../../components/Certificate.jsx";
import { PageHeader, StatusBadge, Loading, useAdminData, fmtDateTime } from "./ui.jsx";

const FILTERS = [
  ["all", "All"],
  ["paid", "Paid"],
  ["pending_payment", "Awaiting payment"],
  ["expired", "Expired"],
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
          <a href={`/api/admin/orders.csv?${query}`} className="btn-ghost !px-5 !py-3">
            Export CSV
          </a>
        }
      />
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
                  </td>
                  <td className="px-4 py-3 text-ivory-mute">{fmtDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loading>

      <AnimatePresence>{open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}

function OrderDrawer({ order: o, onClose }) {
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
            ["Address", `${o.customer.address}, ${o.customer.city} ${o.customer.pincode}`],
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
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.2em]">
            <span className="text-ivory-mute">Invoice {o.invoiceNumber ?? "(issued on first download)"}</span>
            <a href={`/api/admin/orders/${o.id}/invoice`} target="_blank" rel="noreferrer" className="text-ivory-dim hover:text-gold">
              View
            </a>
            <a href={`/api/admin/orders/${o.id}/invoice?download=1`} className="text-gold hover:text-gold-light">
              Download PDF
            </a>
          </div>
        )}

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
