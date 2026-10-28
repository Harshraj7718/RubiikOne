// Pre-order flow: sign in → delivery details → payment → certificate of edition.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../lib/shop.jsx";
import { useAuth, shortName } from "../lib/auth.jsx";
import { formatINR, LAUNCH, totalsFor } from "../data/catalog.js";
import { Emblem } from "../components/Logo.jsx";
import { ease } from "../components/motion.jsx";
import AuthForm from "../components/AuthForm.jsx";
import Certificate from "../components/Certificate.jsx";
import { scrollTop } from "../App.jsx";

const FIELDS = [
  ["phone", "Mobile number", "tel", "tel"],
  ["address", "Delivery address", "text", "street-address"],
  ["city", "City", "text", "address-level2"],
  ["pincode", "PIN code", "text", "postal-code"],
];

async function postJSON(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong. Please try again."), { fields: data.fields ?? [] });
  return data;
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Couldn't load the payment window. Please check your connection."));
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { cart, phase, clear, refreshStatus } = useShop();
  const [coupon, setCoupon] = useState(null); // { code, type, value, label } once a code is applied
  // Shown for guidance only; the server recomputes every amount (and re-checks the coupon) on order.
  const t = totalsFor(
    cart.map((l) => ({ unit: l.unit, list: l.compareAt, qty: l.qty })),
    coupon,
  );
  const cartTotals = { subtotal: t.subtotal, compareTotal: t.listTotal, couponCode: coupon?.code, couponDiscount: t.couponDiscount, gst: t.gst, total: t.total };
  const total = t.total;
  const { user, ready, logout } = useAuth();
  const [form, setForm] = useState({ phone: "", address: "", city: "", pincode: "" });
  const [wall, setWall] = useState({ show: true, displayName: "" });
  const [state, setState] = useState({ busy: false, error: "", fields: [] });
  const [pending, setPending] = useState(null); // { order, payment } awaiting payment
  const [paid, setPaid] = useState(null); // confirmed order with certificates

  useEffect(() => {
    if (user) setWall((w) => ({ ...w, displayName: w.displayName || shortName(user.name) }));
  }, [user]);

  const finish = async (order, proof) => {
    setState({ busy: true, error: "", fields: [] });
    try {
      const data = await postJSON(`/api/orders/${order.id}/verify`, proof);
      setPaid(data.order);
      setPending(null);
      clear();
      refreshStatus();
      scrollTop();
    } catch (err) {
      setState({ busy: false, error: err.message, fields: [] });
    }
  };

  const openRazorpay = async ({ order, payment }) => {
    try {
      await loadRazorpay();
      new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.providerOrderId,
        name: "RUBIIK",
        description: `Pre-order ${order.id}`,
        prefill: { name: payment.name, email: payment.email, contact: payment.contact },
        theme: { color: "#0B1219" },
        handler: (resp) => finish(order, resp),
        modal: { ondismiss: () => setState({ busy: false, error: "Payment was not completed. Your pieces stay held for 30 minutes.", fields: [] }) },
      }).open();
    } catch (err) {
      setState({ busy: false, error: err.message, fields: [] });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: "", fields: [] });
    try {
      const data = await postJSON("/api/prebook", { customer: form, wall, couponCode: coupon?.code ?? "", items: cart.map((l) => ({ slug: l.slug, qty: l.qty })) });
      setPending(data);
      setState({ busy: false, error: "", fields: [] });
      scrollTop();
      if (data.payment.provider === "razorpay") openRazorpay(data);
    } catch (err) {
      // A coupon that stopped working since it was applied (paused, expired, used up) is removed.
      if (err.fields?.includes("coupon")) setCoupon(null);
      setState({ busy: false, error: err.message, fields: err.fields ?? [] });
    }
  };

  if (paid) return <Confirmation order={paid} />;
  if (!ready) return <section className="min-h-screen" />;

  if (!user)
    return (
      <section className="mx-auto grid min-h-screen max-w-[1400px] items-center gap-16 px-5 pb-24 pt-36 sm:px-10 lg:grid-cols-[1.2fr_1fr]">
        <AuthForm title="Sign in to reserve your piece" note="Your account keeps your certificate of edition, your serial number and your order safe." />
        {cart.length > 0 && <Summary cart={cart} totals={cartTotals} />}
      </section>
    );

  if (!cart.length && !pending)
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
      <div className="min-w-0">
        <Steps step={pending ? 2 : 1} />
        <AnimatePresence mode="wait">
          {!pending ? (
            <motion.form key="details" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8, ease }} noValidate>
              <h1 className="mt-8 font-serif text-5xl sm:text-6xl">Reserve your RUBIIK.</h1>
              <p className="mt-4 break-words text-ivory-dim">
                Signed in as <span className="text-ivory">{user.name}</span> ({user.email}).{" "}
                <button type="button" onClick={logout} className="underline decoration-gold/50 underline-offset-4 hover:text-gold">
                  Not you?
                </button>
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

              {/* Founding Owners wall: opt-in, with the name the owner chooses */}
              <div className="frame-royal mt-12 bg-night-800/60 p-6">
                <label className="flex cursor-pointer items-start gap-4">
                  <input type="checkbox" checked={wall.show} onChange={(e) => setWall((w) => ({ ...w, show: e.target.checked }))} className="mt-1 h-4 w-4 accent-[#c9a464]" />
                  <span>
                    <span className="block font-serif text-xl">Show my certificate on the Founding Owners wall</span>
                    <span className="mt-1 block text-sm text-ivory-dim">Your card appears on the home page with the name below. Your email, phone and address are never shown.</span>
                  </span>
                </label>
                {wall.show && (
                  <label className="mt-5 block pl-8">
                    <span className={`eyebrow ${state.fields.includes("displayName") ? "!text-red-300" : ""}`}>Name on the wall</span>
                    <input className="field" value={wall.displayName} maxLength={40} onChange={(e) => setWall((w) => ({ ...w, displayName: e.target.value }))} />
                  </label>
                )}
              </div>

              {state.error && <p className="mt-8 text-sm text-red-300">{state.error}</p>}
              <p className="mt-8 text-xs text-ivory-mute">
                By continuing you agree to our{" "}
                <Link to="/terms" className="text-ivory-dim underline underline-offset-4 hover:text-gold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-ivory-dim underline underline-offset-4 hover:text-gold">
                  Privacy Policy
                </Link>
                .
              </p>
              <button className="btn-gold mt-6 w-full sm:w-auto" disabled={state.busy || phase === "teaser"}>
                {state.busy ? "Reserving…" : `Continue to payment · ${formatINR(total)}`}
              </button>
            </motion.form>
          ) : (
            <Payment key="pay" pending={pending} busy={state.busy} error={state.error} onTestPay={() => finish(pending.order, { test: true })} onRazorpay={() => openRazorpay(pending)} />
          )}
        </AnimatePresence>
      </div>

      <Summary
        cart={pending ? pending.order.items.map((i) => ({ ...i, product: null })) : cart}
        totals={
          pending
            ? {
                subtotal: pending.order.subtotal,
                compareTotal: pending.order.compareAt,
                couponCode: pending.order.coupon?.code,
                couponDiscount: pending.order.coupon?.discount ?? 0,
                gst: pending.order.gst,
                total: pending.order.total,
              }
            : cartTotals
        }
        couponBox={pending ? null : <CouponBox coupon={coupon} onChange={setCoupon} />}
      />
    </section>
  );
}

function Steps({ step }) {
  const labels = ["Details", "Payment", "Certificate"];
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] uppercase tracking-[0.2em] sm:justify-start sm:gap-x-3 sm:text-[10px] sm:tracking-[0.25em]">
      {labels.map((l, i) => (
        <li key={l} className={`flex items-center gap-2 sm:gap-3 ${i + 1 <= step ? "text-gold" : "text-ivory-mute"}`}>
          <span className={`flex h-5 w-5 items-center justify-center border ${i + 1 <= step ? "border-gold" : "border-ivory/20"}`}>{i + 1}</span>
          {l}
          {i < labels.length - 1 && <span className="hidden h-px w-6 bg-ivory/20 sm:block" />}
        </li>
      ))}
    </ol>
  );
}

function Payment({ pending, busy, error, onTestPay, onRazorpay }) {
  const { order, payment } = pending;
  const holdUntil = new Date(order.holdUntil).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease }}>
      <h1 className="mt-8 font-serif text-5xl sm:text-6xl">Complete your payment.</h1>
      <p className="mt-4 max-w-lg text-ivory-dim">
        Order <span className="text-ivory">{order.id}</span>. Your pieces are held for you until {holdUntil}. Your certificate and serial number are issued the moment payment completes.
      </p>

      {payment.provider === "test" ? (
        <div className="mt-10 border border-dashed border-gold/50 bg-gold/5 p-6">
          <p className="eyebrow text-gold">Test mode</p>
          <p className="mt-2 text-ivory-dim">
            No payment gateway is connected yet, so no money is charged. Add Razorpay keys to the server to take real payments. This button simulates a successful payment so you can see the full flow.
          </p>
          <button onClick={onTestPay} disabled={busy} className="btn-gold mt-6">
            {busy ? "Confirming…" : `Complete test payment · ${formatINR(order.total)}`}
          </button>
        </div>
      ) : (
        <button onClick={onRazorpay} disabled={busy} className="btn-gold mt-10">
          {busy ? "Confirming…" : `Pay securely · ${formatINR(order.total)}`}
        </button>
      )}
      {error && <p className="mt-6 text-sm text-red-300">{error}</p>}
    </motion.div>
  );
}

function Summary({ cart, totals: { subtotal, compareTotal, couponCode, couponDiscount = 0, gst, total }, couponBox = null }) {
  return (
    <motion.aside className="frame-royal h-fit bg-night-800 p-8 lg:sticky lg:top-28" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease, delay: 0.15 }}>
      <p className="eyebrow text-ivory">Summary</p>
      {cart.map((l) => (
        <div key={l.slug} className="flex items-center justify-between gap-4 border-b border-ivory/10 py-5">
          <div>
            <p className="font-serif text-xl">{l.product?.edition ?? l.name.replace("RUBIIK ONE ", "")}</p>
            <p className="eyebrow">Qty {l.qty}</p>
          </div>
          <p>{formatINR((l.unit ?? l.unitPrice) * l.qty)}</p>
        </div>
      ))}
      <div className="mt-6 space-y-2 text-sm">
        <Row label="MRP" value={formatINR(compareTotal)} />
        {compareTotal > subtotal && <Row label="Pre-booking privilege (20%)" value={`− ${formatINR(compareTotal - subtotal)}`} gold />}
        {couponDiscount > 0 && <Row label={`Coupon ${couponCode}`} value={`− ${formatINR(couponDiscount)}`} gold />}
        <Row label="Insured delivery" value="Complimentary" />
      </div>
      {couponBox}
      <div className="mt-6 flex items-baseline justify-between border-t border-ivory/10 pt-6">
        <span className="eyebrow text-ivory">Total</span>
        <span className="font-serif text-4xl">{formatINR(total)}</span>
      </div>
      <p className="mt-2 text-right text-xs text-ivory-mute">
        Includes {formatINR(gst)} GST ({Math.round(LAUNCH.gstRate * 100)}%)
      </p>
    </motion.aside>
  );
}

// Enter a code from RUBIIK (created in the admin dashboard); the server confirms it before it applies.
function CouponBox({ coupon, onChange }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState({ busy: false, error: "" });

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setState({ busy: true, error: "" });
    try {
      const { coupon: c } = await postJSON("/api/coupons/check", { code });
      onChange(c);
      setCode("");
      setState({ busy: false, error: "" });
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };

  if (coupon)
    return (
      <div className="mt-5 flex items-center justify-between gap-3 border border-gold/30 bg-gold/5 px-4 py-3 text-sm">
        <span>
          <span className="font-mono text-gold-light">{coupon.code}</span> <span className="text-ivory-dim">applied · {coupon.label}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-[11px] uppercase tracking-[0.15em] text-ivory-mute hover:text-gold">
          Remove
        </button>
      </div>
    );

  // A <div> rather than a nested <form>: the summary can sit beside the details form.
  return (
    <div className="mt-5">
      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Coupon code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && apply(e)}
            placeholder="Enter code"
            maxLength={20}
            className="field font-mono uppercase placeholder:font-sans placeholder:normal-case"
            aria-label="Coupon code"
          />
        </label>
        <button type="button" onClick={apply} disabled={state.busy || !code.trim()} className="btn-ghost !px-5 !py-3">
          {state.busy ? "Checking…" : "Apply"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-300">{state.error}</p>}
    </div>
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
    <section className="px-5 pb-28 pt-36 sm:px-10">
      <motion.div className="mx-auto max-w-3xl text-center" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease }}>
        <Steps step={3} />
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.2, ease, delay: 0.3 }} style={{ originY: 0 }} className="mx-auto mt-10 w-fit">
          <Emblem className="h-16" />
        </motion.div>
        <p className="eyebrow mt-8 text-gold">Payment received · {order.id}</p>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl">Welcome, {order.customer.name.split(" ")[0]}.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ivory-dim">
          {order.certificates.length > 1 ? "Your pieces are" : "Your piece is"} officially part of the edition. Delivery follows the launch on{" "}
          {new Date(LAUNCH.launch).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.
          {order.wall?.show ? ` Your card now appears on the Founding Owners wall as “${order.wall.displayName}”.` : ""}
        </p>
      </motion.div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-10">
        {order.certificates.map((c, i) => (
          <motion.div key={c.serial} initial={{ opacity: 0, y: 60, rotateX: 25 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.3, ease, delay: 0.5 + i * 0.25 }} style={{ transformPerspective: 1200 }}>
            <Certificate cert={c} name={c.ownerName} size="lg" />
          </motion.div>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-4">
        <Link to="/account" className="btn-gold">
          View my collection
        </Link>
        <Link to="/#owners" className="btn-ghost">
          See the owners wall
        </Link>
      </div>
    </section>
  );
}
