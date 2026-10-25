import { useRef, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { findProduct, PRODUCTS, formatINR, unitPrice, GST_LABEL } from "../data/catalog.js";
import { useShop, MAX_PER_MODEL } from "../lib/shop.jsx";
import { SplitReveal, FadeUp, Magnetic, ParallaxImage, ease } from "../components/motion.jsx";
import { EdgeVeins } from "../components/GoldVeins.jsx";

export default function Product() {
  const { slug } = useParams();
  const p = findProduct(slug);
  const { phase, add, status, cart } = useShop();
  const [view, setView] = useState("front");
  const [qty, setQty] = useState(1);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const watchY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const nameX = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);

  if (!p) return <Navigate to="/" replace />;
  const other = PRODUCTS.find((q) => q.slug !== p.slug);
  const stock = status.stock;
  const inCart = cart.find((l) => l.slug === p.slug)?.qty ?? 0;
  const canAdd = Math.max(0, MAX_PER_MODEL - inCart);

  return (
    <div key={p.slug}>
      <section ref={ref} className="grain relative isolate min-h-screen overflow-hidden pt-28">
        <EdgeVeins corners={["top-left","bottom-right"]} seed={71} />
        <motion.p
          style={{ x: nameX }}
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[22vw] uppercase leading-none text-ivory/[0.04]"
        >
          {p.edition}
        </motion.p>
        <div className="relative mx-auto grid max-w-[1600px] items-center gap-10 px-5 pb-20 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Viewer */}
          <div className="relative flex flex-col items-center">
            <div className="absolute left-1/2 top-1/2 h-[50vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl" style={{ background: p.accent }} />
            <motion.div style={{ y: watchY }} className="relative flex h-[66vh] items-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={view}
                  src={view === "front" ? p.images.cutout : p.images.caseback}
                  alt={`${p.name} ${p.edition} — ${view}`}
                  className={`${view === "front" ? "h-[62vh]" : "h-[44vh]"} w-auto drop-shadow-[0_50px_60px_rgba(0,0,0,0.7)]`}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0, transition: { duration: 0.8, ease } }}
                  exit={{ opacity: 0, rotateY: -90, transition: { duration: 0.4 } }}
                  style={{ transformPerspective: 1000 }}
                  draggable={false}
                />
              </AnimatePresence>
            </motion.div>
            <div className="relative mt-4 flex gap-1 border border-gold/30 p-1">
              {["front", "caseback"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-5 py-2 text-[11px] uppercase tracking-wide2 transition-colors ${view === v ? "bg-gold text-night" : "text-ivory/70 hover:text-ivory"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Purchase panel */}
          <div>
            <Link to="/#collection" className="eyebrow hover:text-gold">
              ← The collection
            </Link>
            <p className="eyebrow mt-10" style={{ color: p.accent }}>
              {p.finish} · One edition of {stock.total}
            </p>
            <h1 className="mt-3 font-serif text-6xl leading-none sm:text-7xl">
              <SplitReveal text={p.name} />
            </h1>
            <p className="mt-2 font-serif text-3xl italic text-gold">{p.edition}</p>
            <FadeUp className="mt-6 max-w-lg text-lg leading-relaxed text-ivory-dim">{p.blurb}</FadeUp>

            <div className="mt-10 flex items-end gap-5 border-t border-ivory/10 pt-8">
              <div>
                {phase === "launched" ? (
                  <p className="font-serif text-5xl">{formatINR(p.price)}</p>
                ) : (
                  <>
                    <p className="text-ivory-mute line-through">{formatINR(p.price)}</p>
                    <p className="font-serif text-5xl">{formatINR(unitPrice(p, "prebook"))}</p>
                  </>
                )}
                <p className="eyebrow mt-2 text-gold">
                  {phase === "launched" ? GST_LABEL : `Pre-booking privilege · 20% off · ${GST_LABEL}`}
                </p>
              </div>
              <p className="eyebrow ml-auto tabular-nums">
                {stock.remaining} of {stock.total} remaining
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {phase === "teaser" ? (
                <Link to="/#prebook" className="btn-gold">
                  Notify me
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-4 border border-gold/30 px-5 py-3">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="hover:text-gold" aria-label="Decrease">
                      −
                    </button>
                    <span className="w-4 text-center tabular-nums">{Math.min(qty, Math.max(1, canAdd))}</span>
                    <button onClick={() => setQty((q) => Math.min(canAdd, q + 1))} className="hover:text-gold" aria-label="Increase">
                      +
                    </button>
                  </div>
                  <Magnetic>
                    <button className="btn-gold" disabled={!canAdd || stock?.remaining <= 0} onClick={() => add(p.slug, Math.min(qty, canAdd))}>
                      {stock?.remaining <= 0
                        ? "Sold out"
                        : !canAdd
                          ? `Limit ${MAX_PER_MODEL} per client`
                          : `${phase === "prebook" ? "Pre-book" : "Add"} · ${formatINR(unitPrice(p, phase) * Math.min(qty, canAdd))}`}
                    </button>
                  </Magnetic>
                </>
              )}
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-ivory-dim">
              <li>◆ Numbered edition certificate</li>
              <li>◆ Complimentary insured delivery</li>
              <li>◆ All stainless steel</li>
              <li>◆ 5 ATM water resistant</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="bg-ivory py-24 text-night">
        <div className="mx-auto grid max-w-[1600px] gap-16 px-5 sm:px-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow !text-gold-deep">Specifications</p>
            <h2 className="mt-4 font-serif text-5xl">A form of its own.</h2>
          </div>
          <div className="border-t border-night/15">
            {p.specs.map(([k, v], i) => (
              <FadeUp key={k} y={16} delay={i * 0.04} className="grid grid-cols-2 border-b border-night/10 py-5">
                <span className="font-serif text-2xl">{k}</span>
                <span className="text-night/70">{v}</span>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto grid max-w-[1600px] gap-6 px-5 py-24 sm:px-10 md:grid-cols-6">
        {p.images.gallery.map((src, i) => (
          <ParallaxImage
            key={src}
            src={src}
            alt={`${p.name} ${p.edition} lifestyle ${i + 1}`}
            strength={60}
            scale={1.2}
            className={`rounded-sm ${["md:col-span-4 h-[70vh]", "md:col-span-2 h-[70vh]", "md:col-span-3 h-[60vh]", "md:col-span-3 h-[60vh]", "md:col-span-6 h-[80vh]"][i]}`}
          />
        ))}
      </section>

      {/* Other model */}
      <section className="relative isolate overflow-hidden border-t border-ivory/10 py-24">
        <Link to={`/watch/${other.slug}`} className="group mx-auto flex max-w-[1600px] flex-col items-center gap-6 px-5 text-center sm:px-10" data-cursor="Next">
          <p className="eyebrow">Also in the edition</p>
          <img src={other.images.cutout} alt="" className="h-64 transition-transform duration-[1.2s] ease-lux group-hover:-translate-y-4 group-hover:rotate-6" />
          <p className="font-serif text-5xl transition-colors group-hover:text-gold sm:text-7xl">{other.edition}</p>
        </Link>
      </section>
    </div>
  );
}
