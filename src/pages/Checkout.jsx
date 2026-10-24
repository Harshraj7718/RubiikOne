import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useShop } from "../lib/shop.jsx";
import { formatINR, LAUNCH } from "../data/catalog.js";
import { Emblem } from "../components/Logo.jsx";
import { ease } from "../components/motion.jsx";
import { scrollTop } from "../App.jsx";

const FIELDS = [
  ["name", "Full name", "text", "name"],
  ["email", "Email", "email", "email"],
  ["phone", "Mobile number", "tel", "tel"],
  ["address", "Delivery address", "text", "street-address"],
  ["city", "City", "text", "address-level2"],
  ["pincode", "PIN code", "text", "postal-code"],
];

export default function Checkout() {
  const { cart, subtotal, compareTotal, phase, clear, refreshStatus } = useShop();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", pincode: "" });
  const [state, setState] = useState({ status: "idle", error: "", fields: [] });
  const [order, setOrder] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: "loading", error: "", fields: [] });
    try {
      const res = await fetch("/api/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items: cart.map((l) => ({ slug: l.slug, qty: l.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) return setState({ status: "error", error: data.error, fields: data.fields ?? [] });
      setOrder(data.order);
      scrollTop();
      clear();
      refreshStatus();
    } catch {
      setState({ status: "error", error: "We couldn't reach the RUBIIK concierge. Please try again.", fields: [] });
    }
  };

  if (order) return <Confirmation order={order} />;

  if (!cart.length)
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
        <p className="font-serif text-5xl italic">Your selection is empty.</p>
        <Link to="/#collection" className="btn-gold">
          Discover RUBIIK ONE
        </Link>
      </section>
    );

  return (
    <section className="mx-auto grid min-h-screen max-w-[1400px] gap-16 px-5 pb-24 pt-36 sm:px-10 lg:grid-cols-[1.3fr_1fr]">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }} noValidate>
        <p className="eyebrow text-gold">{phase === "prebook" ? "Pre-booking" : "Checkout"}</p>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl">Reserve your RUBIIK.</h1>
        <p className="mt-4 max-w-lg text-ivory-dim">
          {phase === "prebook"
            ? `Your numbered pieces are held at the pre-booking price and delivered from ${new Date(LAUNCH.launch).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}. Our concierge will contact you to complete payment.`
            : "Our concierge will contact you to complete payment and arrange insured delivery."}
        </p>
        <div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {FIELDS.map(([key, label, type, ac]) => (
            <label key={key} className={key === "address" ? "sm:col-span-2" : ""}>
              <span className={`eyebrow ${state.fields.includes(key) ? "!text-red-300" : ""}`}>{label}</span>
              <input
                className={`field ${state.fields.includes(key) ? "!border-red-300" : ""}`}
                type={type}
                autoComplete={ac}
                inputMode={key === "pincode" ? "numeric" : undefined}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required
              />
            </label>
          ))}
        </div>
        {state.error && <p className="mt-8 text-sm text-red-300">{state.error}</p>}
        <button className="btn-gold mt-12 w-full sm:w-auto" disabled={state.status === "loading" || phase === "teaser"}>
          {state.status === "loading" ? "Reserving…" : `Confirm reservation · ${formatINR(subtotal)}`}
        </button>
      </motion.form>

      <motion.aside
        className="frame-royal h-fit bg-night-800 p-8 lg:sticky lg:top-28"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease, delay: 0.15 }}
      >
        <p className="eyebrow text-ivory">Summary</p>
        {cart.map((l) => (
          <div key={l.slug} className="flex items-center gap-4 border-b border-ivory/10 py-5">
            <img src={l.product.images.cutout} alt="" className="h-20" />
            <div className="flex-1">
              <p className="font-serif text-xl">{l.product.edition}</p>
              <p className="eyebrow">Qty {l.qty}</p>
            </div>
            <p>{formatINR(l.unit * l.qty)}</p>
          </div>
        ))}
        <div className="mt-6 space-y-2 text-sm">
          <Row label="Subtotal" value={formatINR(compareTotal)} />
          {compareTotal > subtotal && <Row label="Pre-booking privilege (20%)" value={`− ${formatINR(compareTotal - subtotal)}`} gold />}
          <Row label="Insured delivery" value="Complimentary" />
        </div>
        <div className="mt-6 flex items-baseline justify-between border-t border-ivory/10 pt-6">
          <span className="eyebrow text-ivory">Total</span>
          <span className="font-serif text-4xl">{formatINR(subtotal)}</span>
        </div>
      </motion.aside>
    </section>
  );
}

function Row({ label, value, gold }) {
  return (
    <div className={`flex justify-between ${gold ? "text-gold-light" : "text-ivory-dim"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Confirmation({ order }) {
  return (
    <section className="flex min-h-screen items-center justify-center px-5 py-32">
      <motion.div className="max-w-xl text-center" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease }}>
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.2, ease, delay: 0.3 }} style={{ originY: 0 }} className="mx-auto w-fit">
          <Emblem className="h-20" />
        </motion.div>
        <p className="eyebrow mt-10 text-gold">Reservation {order.id}</p>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl">Thank you, {order.customer.name.split(" ")[0]}.</h1>
        <p className="mt-6 text-lg text-ivory-dim">
          Your RUBIIK is reserved. A confirmation has been noted for {order.customer.email}; our concierge will contact you shortly to complete payment.
        </p>
        <div className="frame-royal mt-10 space-y-3 p-6 text-left">
          {order.items.map((i) => (
            <div key={i.slug} className="flex justify-between gap-4">
              <span className="font-serif text-xl">{i.name}</span>
              <span className="eyebrow text-gold">No. {i.editionNumbers.map((n) => String(n).padStart(3, "0")).join(", ")} / 200</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-ivory/10 pt-3">
            <span className="eyebrow text-ivory">Total</span>
            <span className="font-serif text-2xl">{formatINR(order.subtotal)}</span>
          </div>
        </div>
        <Link to="/" className="btn-ghost mt-10">
          Return to RUBIIK
        </Link>
      </motion.div>
    </section>
  );
}
