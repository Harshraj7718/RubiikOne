// Account: sign in, or see your certificates and any pre-orders awaiting payment.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import { formatINR } from "../data/catalog.js";
import AuthForm from "../components/AuthForm.jsx";
import Certificate from "../components/Certificate.jsx";
import { ease } from "../components/motion.jsx";

export default function Account() {
  const { user, ready, logout } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return setOrders(null);
    fetch("/api/me/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, [user]);

  if (!ready) return <section className="min-h-screen" />;
  if (!user)
    return (
      <section className="mx-auto flex min-h-screen max-w-xl items-center px-5 pb-24 pt-36">
        <div className="w-full">
          <AuthForm title="Your RUBIIK account" note="Sign in to see your certificates of edition and serial numbers." />
        </div>
      </section>
    );

  const certificates = (orders ?? []).filter((o) => o.status === "paid").flatMap((o) => o.certificates);
  const awaiting = (orders ?? []).filter((o) => o.status === "pending_payment");
  const paidOrders = (orders ?? []).filter((o) => o.status === "paid");

  return (
    <section className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-36 sm:px-10">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }} className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-gold">Your account</p>
          <h1 className="mt-3 font-serif text-5xl sm:text-6xl">{user.name}</h1>
          <p className="mt-2 text-ivory-dim">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={logout} className="btn-ghost">
            Sign out
          </button>
        </div>
      </motion.div>

      <h2 className="mt-16 font-serif text-3xl">Your collection</h2>
      {orders === null ? null : certificates.length === 0 ? (
        <div className="mt-6 frame-royal bg-night-800/60 p-8 text-center">
          <p className="font-serif text-2xl italic">No pieces yet.</p>
          <p className="mt-2 text-ivory-dim">Your certificate of edition appears here as soon as your pre-order payment completes.</p>
          <Link to="/#prebook" className="btn-gold mt-6">
            Reserve your piece
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10">
          {certificates.map((c, i) => (
            <motion.div key={c.serial} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease, delay: i * 0.15 }}>
              <Certificate cert={c} name={c.ownerName} size="lg" />
            </motion.div>
          ))}
        </div>
      )}

      {paidOrders.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl">Invoices</h2>
          {paidOrders.map((o) => (
            <div key={o.id} className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-ivory/10 py-4 text-ivory-dim">
              <span>
                <span className="text-ivory">{o.invoiceNumber ?? o.id}</span> · {o.items.map((i) => `${i.qty}× ${i.name.replace("RUBIIK ONE ", "")}`).join(", ")} · {formatINR(o.total)}
              </span>
              <span className="flex gap-5 text-[11px] uppercase tracking-[0.2em]">
                <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noreferrer" className="hover:text-gold">
                  View
                </a>
                <a href={`/api/orders/${o.id}/invoice?download=1`} className="text-gold hover:text-gold-light">
                  Download PDF
                </a>
              </span>
            </div>
          ))}
        </div>
      )}

      {awaiting.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl">Awaiting payment</h2>
          {awaiting.map((o) => (
            <div key={o.id} className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-ivory/10 py-4 text-ivory-dim">
              <span>
                {o.id} · {o.items.map((i) => `${i.qty}× ${i.name.replace("RUBIIK ONE ", "")}`).join(", ")}
              </span>
              <span>
                {formatINR(o.total)} · held until {new Date(o.holdUntil).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
