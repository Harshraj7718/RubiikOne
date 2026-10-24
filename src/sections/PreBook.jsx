// Pre-booking: timeline (6 Nov → 25 Dec), live countdown, pricing and the two products.
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS, LAUNCH, formatINR, unitPrice } from "../data/catalog.js";
import { useShop } from "../lib/shop.jsx";
import { useCountdown, pad } from "../lib/hooks.js";
import { SplitReveal, FadeUp, Tilt, Magnetic, ParallaxImage, ease } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";
import Particles from "../components/Particles.jsx";
import { Baubles, Star, Holly, GiftRibbon } from "../components/Christmas.jsx";

const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export default function PreBook() {
  const { phase, status } = useShop();
  const target = phase === "teaser" ? LAUNCH.prebookOpens : LAUNCH.launch;
  const t = useCountdown(target);

  const steps = [
    { date: "Today", title: "Discover", text: "Explore RUBIIK ONE and join the list.", active: phase === "teaser" },
    { date: fmt(LAUNCH.prebookOpens), title: "Pre-booking opens", text: "Reserve your numbered piece with 20% off.", active: phase === "prebook" },
    { date: fmt(LAUNCH.launch), title: "Christmas launch", text: "RUBIIK ONE is revealed and delivered.", active: phase === "launched" },
  ];

  return (
    <section id="prebook" className="relative overflow-hidden bg-wine-800 py-28 sm:py-40">
      <div className="damask pointer-events-none absolute inset-0 opacity-[0.05]" />
      {/* Christmas: soft snowfall, warm glow and hanging baubles */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_at_top,rgba(165,0,3,0.55),transparent_65%)]" />
      <Particles mode="snow" density={0.8} />
      <Baubles className="hidden sm:block" />
      <div className="relative mx-auto max-w-[1600px] px-5 sm:px-10">
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Holly className="h-8 w-14 sm:h-10 sm:w-16" />
            <Star className="h-14 w-14 sm:h-16 sm:w-16" />
            <Holly className="h-8 w-14 sm:h-10 sm:w-16" flip />
          </div>
          <Chapter n="IX" title="Pre-booking · A Christmas reveal" center />
          <h2 className="mx-auto mt-6 max-w-5xl font-serif text-5xl leading-[1.02] sm:text-8xl">
            <SplitReveal text="Reserve your piece" by="word" />
            <br />
            <SplitReveal text="of the edition." by="word" className="italic text-gold" delay={0.2} />
          </h2>
          <FadeUp className="mx-auto mt-8 max-w-xl text-lg text-ivory-dim">
            Pre-book from {fmt(LAUNCH.prebookOpens)} and receive an exclusive <span className="text-gold-light">20% privilege</span>. RUBIIK ONE launches on
            Christmas Day, {fmt(LAUNCH.launch)}.
          </FadeUp>
          <FadeUp delay={0.15} className="mt-4 font-serif text-2xl italic text-gold sm:text-3xl">
            The gift of time, unwrapped on Christmas morning.
          </FadeUp>
        </div>

        {/* The Christmas pair: a framed window onto the festive campaign shot */}
        <FadeUp className="relative mx-auto mt-16 max-w-6xl">
          <div className="frame-royal relative">
            <ParallaxImage
              src="/images/christmas-duo.webp"
              alt="RUBIIK ONE Automatic Skeleton and Quartz Olive beside wrapped gifts, Christmas lights and snow"
              className="aspect-[4/3] w-full sm:aspect-[2/1]"
              imgClassName="object-[50%_55%]"
              strength={50}
              scale={1.15}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-900/85 via-transparent to-night-900/20" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
              <div>
                <p className="eyebrow text-gold">RUBIIK ONE · The Christmas pair</p>
                <p className="mt-1 font-serif text-2xl sm:text-4xl">Two characters. One unforgettable gift.</p>
              </div>
              <p className="font-serif text-lg italic text-gold-light sm:text-2xl">Under the tree · 25 · XII</p>
            </div>
          </div>
          <Holly className="absolute -left-4 -top-5 h-10 w-16 -rotate-12 sm:-left-8 sm:-top-7 sm:h-14 sm:w-24" />
          <Holly className="absolute -bottom-5 -right-4 h-10 w-16 rotate-12 sm:-bottom-7 sm:-right-8 sm:h-14 sm:w-24" flip />
        </FadeUp>

        {/* Countdown */}
        {phase !== "launched" && (
          <FadeUp className="mx-auto mt-16 flex max-w-3xl justify-center gap-3 sm:gap-6">
            {[
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
            ))}
          </FadeUp>
        )}
        <p className="eyebrow mt-5 text-center">{phase === "teaser" ? "Until pre-booking opens" : phase === "prebook" ? "Until the Christmas launch" : ""}</p>

        {/* Timeline */}
        <div className="relative mx-auto mt-20 grid max-w-5xl gap-10 md:grid-cols-3">
          <div className="hairline absolute left-0 right-0 top-[7px] hidden md:block" />
          {steps.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.12} className="relative text-center">
              {i === steps.length - 1 ? (
                // Christmas Day is marked with the star rather than a diamond.
                <Star className="relative z-10 mx-auto -mt-4 h-12 w-12" />
              ) : (
                <span className={`relative z-10 mx-auto block h-4 w-4 rotate-45 border ${s.active ? "bg-gold border-gold" : "border-gold/60 bg-wine-800"}`}>
                  {s.active && <span className="bg-gold absolute inset-0 animate-ping opacity-60" />}
                </span>
              )}
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

function ProductCard({ p, i, phase, stock }) {
  const { add } = useShop();
  const price = unitPrice(p, phase);
  const soldOut = stock && stock.remaining <= 0;
  return (
    <FadeUp delay={i * 0.15}>
      <Tilt className="frame-royal group relative overflow-hidden bg-gradient-to-br from-night-600/60 to-night-900 p-8 sm:p-12" max={5}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl transition-opacity duration-700 group-hover:opacity-60" style={{ background: p.accent }} />
        <GiftRibbon label="25 · XII" />
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
                  <p className="font-serif text-4xl">{formatINR(Math.round(p.price * (1 - LAUNCH.prebookDiscount)))}</p>
                  <p className="text-ivory-mute line-through">{formatINR(p.price)}</p>
                </div>
              )}
              <p className="eyebrow mt-2">
                {phase === "launched" ? "Limited edition" : "Pre-booking price · save " + formatINR(p.price - Math.round(p.price * 0.8))}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
              {phase === "teaser" ? (
                <span className="btn-ghost pointer-events-none opacity-70">Opens 6 Nov</span>
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
