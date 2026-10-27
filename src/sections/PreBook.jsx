// Pre-booking: timeline (pre-booking open now → launch on 6 Nov), live countdown, pricing and the two products.
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS, LAUNCH, formatINR, unitPrice, GST_LABEL } from "../data/catalog.js";
import { useShop } from "../lib/shop.jsx";
import { useCountdown, pad } from "../lib/hooks.js";
import { SplitReveal, FadeUp, Tilt, Magnetic, ease } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";
import Particles from "../components/Particles.jsx";
import { Toran, Rangoli, Diya, GoldCoins } from "../components/Dhanteras.jsx";

const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export default function PreBook() {
  const { phase, status } = useShop();
  const target = phase === "teaser" ? LAUNCH.prebookOpens : LAUNCH.launch;

  const steps = [
    { date: "Today", title: "Discover", text: "Explore RUBIIK ONE and join the list.", active: phase === "teaser" },
    { date: phase === "teaser" ? fmt(LAUNCH.prebookOpens) : "Now open", title: "Pre-booking", text: "Reserve your numbered piece with 20% off.", active: phase === "prebook" },
    { date: fmt(LAUNCH.launch), title: "Launch", text: "RUBIIK ONE is revealed and deliveries begin.", active: phase === "launched" },
  ];

  return (
    <section id="prebook" className="relative overflow-hidden bg-wine-800 py-28 sm:py-40">
      <div className="damask pointer-events-none absolute inset-0 opacity-[0.05]" />
      {/* Warm glow and drifting gold dust */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_at_top,rgba(165,0,3,0.55),transparent_65%)]" />
      <Particles density={0.8} />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-10">
        <div className="text-center">
          <Chapter n="IX" title={phase === "prebook" ? "Pre-booking · Now open" : "Pre-booking"} center />
          <h2 className="mx-auto mt-6 max-w-5xl font-serif text-5xl leading-[1.02] sm:text-8xl">
            <SplitReveal text="Reserve your piece" by="word" />
            <br />
            <SplitReveal text="of the edition." by="word" className="italic text-gold" delay={0.2} />
          </h2>
          <FadeUp className="mx-auto mt-8 max-w-xl text-lg text-ivory-dim">
            {phase === "launched" ? (
              <>RUBIIK ONE launched on {fmt(LAUNCH.launch)}. The remaining numbered pieces are available while they last.</>
            ) : (
              <>
                {phase === "teaser" ? `Pre-book from ${fmt(LAUNCH.prebookOpens)} and receive` : "Pre-booking is open now. Reserve yours and receive"} an exclusive{" "}
                <span className="text-gold-light">{Math.round(LAUNCH.prebookDiscount * 100)}% privilege</span>. RUBIIK ONE launches on {fmt(LAUNCH.launch)}.
              </>
            )}
          </FadeUp>
          <FadeUp delay={0.15} className="mt-4 font-serif text-2xl italic text-gold sm:text-3xl">
            Only 200 pieces. Never repeated.
          </FadeUp>
        </div>

        <LaunchDate />

        {/* Countdown */}
        {phase !== "launched" && (
          <FadeUp className="mx-auto mt-16 flex max-w-3xl justify-center gap-3 sm:gap-6">
            <CountdownTiles iso={target} />
          </FadeUp>
        )}
        <p className="eyebrow mt-5 text-center">{phase === "teaser" ? "Until pre-booking opens" : phase === "prebook" ? "Until the launch" : ""}</p>

        {/* Timeline */}
        <div className="relative mx-auto mt-20 grid max-w-5xl gap-10 md:grid-cols-3">
          <div className="hairline absolute left-0 right-0 top-[7px] hidden md:block" />
          {steps.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.12} className="relative text-center">
              <span className={`relative z-10 mx-auto block h-4 w-4 rotate-45 border ${s.active ? "bg-gold border-gold" : "border-gold/60 bg-wine-800"}`}>
                {s.active && <span className="bg-gold absolute inset-0 animate-ping opacity-60" />}
              </span>
              <p className="eyebrow mt-6 text-gold">{s.date}</p>
              <p className="mt-2 font-serif text-3xl">{s.title}</p>
              <p className="mt-2 text-sm text-ivory-dim">{s.text}</p>
            </FadeUp>
          ))}
        </div>

        {/* Products */}
        <div className="mt-24 grid gap-8 lg:grid-cols-2">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.slug} p={p} i={i} phase={phase} stock={status.stock} />
          ))}
        </div>

        {phase === "teaser" && <Waitlist />}
      </div>
    </section>
  );
}

// Only the four tiles re-render every second, not the whole section.
function CountdownTiles({ iso }) {
  const t = useCountdown(iso);
  return [
    [t.days, "Days"],
    [t.hours, "Hours"],
    [t.minutes, "Minutes"],
    [t.seconds, "Seconds"],
  ].map(([v, l]) => (
    <div key={l} className="frame-royal flex w-1/4 flex-col items-center bg-wine-900/60 py-6">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={v}
          className="font-serif text-4xl tabular-nums sm:text-6xl"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          {pad(v)}
        </motion.span>
      </AnimatePresence>
      <span className="mt-2 font-sans text-[9px] uppercase tracking-[0.18em] text-ivory-mute sm:text-[11px] sm:tracking-mega">{l}</span>
    </div>
  ));
}

// The launch date set as a headline, dressed for Dhanteras (the launch day): a marigold toran above,
// a slowly turning rangoli behind the date, drifting gold coins and a row of lit diyas below.
function LaunchDate() {
  const part = (opt) => new Date(LAUNCH.launch).toLocaleDateString("en-IN", { ...opt, timeZone: "Asia/Kolkata" });
  const [day, month, year] = [part({ day: "numeric" }), part({ month: "long" }), part({ year: "numeric" })];
  return (
    <div className="relative mx-auto mt-20 max-w-6xl overflow-hidden pb-10 pt-16 text-center sm:mt-24 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,162,58,0.22),transparent_62%)]" />
      {/* The wrapper centres the rangoli; the rangoli's own transform is left free for its rotation. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 w-[min(150vw,46rem)] -translate-x-1/2 -translate-y-1/2 opacity-40">
        <Rangoli className="block w-full" />
      </div>
      <GoldCoins />
      <Toran className="pointer-events-none absolute left-1/2 top-0 w-[170%] max-w-4xl -translate-x-1/2 sm:w-full" />

      <div className="relative">
        <FadeUp className="flex items-center justify-center gap-4 sm:gap-6">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold sm:w-24" />
          <span className="eyebrow whitespace-nowrap text-gold">The launch · Dhanteras</span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold sm:w-24" />
        </FadeUp>
        <h3
          aria-label={`Launching ${day} ${month} ${year}, on Dhanteras`}
          className="mt-6 flex flex-wrap items-baseline justify-center gap-x-[0.18em] font-serif text-[clamp(4.25rem,11vw,10rem)] leading-[0.9] [text-shadow:0_0_40px_rgba(232,162,58,0.35)]"
        >
          <SplitReveal text={day} />
          <SplitReveal text={month} className="italic text-gold" delay={0.12} />
          <SplitReveal text={year} delay={0.24} />
        </h3>
        <FadeUp delay={0.3} className="mx-auto mt-6 max-w-xl font-serif text-xl italic text-gold-light sm:text-2xl">
          Unveiled on Dhanteras, the day of gold and new beginnings.
        </FadeUp>
        <FadeUp delay={0.4} className="mt-8 flex items-end justify-center gap-3 sm:gap-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <Diya key={i} delay={i * 0.35} className={i === 2 ? "h-16 w-16 sm:h-20 sm:w-20" : "h-11 w-11 sm:h-14 sm:w-14"} />
          ))}
        </FadeUp>
        <FadeUp delay={0.45} className="mt-5 text-[11px] uppercase tracking-[0.35em] text-ivory-mute">
          RUBIIK ONE · 00:00 IST
        </FadeUp>
      </div>
    </div>
  );
}

function ProductCard({ p, i, phase, stock }) {
  const { add } = useShop();
  const price = unitPrice(p, phase);
  // Before pre-booking opens, cards still preview the pre-booking price.
  const prebookPrice = unitPrice(p, "prebook");
  const soldOut = stock && stock.remaining <= 0;
  return (
    <FadeUp delay={i * 0.15}>
      <Tilt className="frame-royal group relative overflow-hidden bg-gradient-to-br from-night-600/60 to-night-900 p-8 sm:p-12" max={5}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl transition-opacity duration-700 group-hover:opacity-60" style={{ background: p.accent }} />
        <div className="relative flex flex-col items-center gap-8 sm:flex-row">
          <Link to={`/watch/${p.slug}`} className="shrink-0" data-cursor="Discover">
            <img loading="lazy" decoding="async"
              src={p.images.cutout}
              alt={`${p.name} ${p.edition}`}
              className="h-72 w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] transition-transform duration-[1.2s] ease-lux group-hover:-rotate-6 group-hover:scale-105"
            />
          </Link>
          <div className="flex-1 text-center sm:text-left">
            <p className="eyebrow" style={{ color: p.accent }}>
              {p.finish}
            </p>
            <h3 className="mt-2 font-serif text-4xl">{p.name}</h3>
            <p className="font-serif text-2xl italic text-gold">{p.edition}</p>
            <div className="mt-6">
              {phase === "launched" ? (
                <p className="font-serif text-4xl">{formatINR(p.price)}</p>
              ) : (
                <div className="flex items-baseline justify-center gap-4 sm:justify-start">
                  <p className="font-serif text-4xl">{formatINR(prebookPrice)}</p>
                  <p className="text-ivory-mute line-through">{formatINR(p.price)}</p>
                </div>
              )}
              <p className="eyebrow mt-2">
                {phase === "launched" ? `Limited edition · ${GST_LABEL}` : `Pre-booking price · save ${formatINR(p.price - prebookPrice)} · ${GST_LABEL}`}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
              {phase === "teaser" ? (
                <span className="btn-ghost pointer-events-none opacity-70">Opening soon</span>
              ) : (
                <Magnetic>
                  <button className="btn-gold" disabled={soldOut} onClick={() => add(p.slug)}>
                    {soldOut ? "Sold out" : phase === "prebook" ? `Pre-book · ${formatINR(price)}` : "Add to selection"}
                  </button>
                </Magnetic>
              )}
              <Link to={`/watch/${p.slug}`} className="btn-ghost">
                Details
              </Link>
            </div>
          </div>
        </div>
      </Tilt>
    </FadeUp>
  );
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });
  const submit = async (e) => {
    e.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState({ status: "done", message: "You're on the list. We'll write the moment pre-booking opens." });
    } catch (err) {
      setState({ status: "error", message: err.message || "Please try again." });
    }
  };
  return (
    <FadeUp className="mx-auto mt-20 max-w-2xl text-center">
      <p className="font-serif text-3xl">Be first when pre-booking opens.</p>
      {state.status === "done" ? (
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-gold-light">
          {state.message}
        </motion.p>
      ) : (
        <form onSubmit={submit} className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="field flex-1 text-center sm:text-left" />
          <button className="btn-gold shrink-0" disabled={state.status === "loading"}>
            {state.status === "loading" ? "Joining…" : "Notify me"}
          </button>
        </form>
      )}
      {state.status === "error" && <p className="mt-3 text-sm text-red-300">{state.message}</p>}
    </FadeUp>
  );
}
