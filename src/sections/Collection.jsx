// RUBIIK ONE — The Signature Collection. A pinned stage where scrolling swaps
// between the two models: the watch turns, the backdrop shifts gunmetal → olive.
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { PRODUCTS, formatINR, unitPrice } from "../data/catalog.js";
import { useShop } from "../lib/shop.jsx";
import { SplitReveal, FadeUp, Magnetic, ease } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";

export default function Collection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setIdx(v < 0.5 ? 0 : 1));

  const bg = useTransform(scrollYProgress, [0.35, 0.65], ["#070C11", "#4D0002"]);
  const glow = useTransform(scrollYProgress, [0.35, 0.65], ["rgba(141,144,148,0.22)", "rgba(138,154,58,0.28)"]);
  const watchRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 8]);
  const watchY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const { phase, add } = useShop();
  const p = PRODUCTS[idx];

  return (
    <section id="collection" className="relative isolate">
      <div className="mx-auto max-w-[1600px] px-5 pb-20 pt-28 sm:px-10 sm:pt-40">
        <Chapter n="IV" title="The signature collection" className="mb-6" />
        <h2 className="font-serif text-6xl leading-none sm:text-[9vw]">
          <SplitReveal text="RUBIIK ONE" />
        </h2>
        <FadeUp className="mt-10 grid gap-8 text-lg text-ivory-dim md:grid-cols-2">
          <p>
            Introducing RUBIIK ONE — the first expression of our design philosophy. Defined by bold geometry, architectural proportions and refined
            detailing, it represents a distinctive perspective on contemporary watchmaking.
          </p>
          <p>
            Created for those who value individuality over convention, RUBIIK ONE brings together a sculpted silhouette and an understated aesthetic that
            speaks without saying too much.
          </p>
        </FadeUp>
      </div>

      <motion.div ref={ref} style={{ backgroundColor: bg }} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: useTransform(glow, (g) => `radial-gradient(circle at 50% 55%, ${g}, transparent 60%)`) }} />

          {/* Giant edition name behind the watch */}
          <AnimatePresence mode="wait">
            <motion.p
              key={p.slug}
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-[16vw] uppercase leading-none text-ivory/[0.05]"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 1, ease } }}
              exit={{ opacity: 0, y: -80, transition: { duration: 0.5 } }}
            >
              {idx === 0 ? "Automatic" : "Quartz"}
            </motion.p>
          </AnimatePresence>

          <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-6 px-5 sm:px-10 lg:grid-cols-[1fr_auto_1fr]">
            {/* Copy */}
            <div className="order-2 lg:order-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={p.slug}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.9, ease } }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.4 } }}
                >
                  <p className="eyebrow mb-3" style={{ color: p.accent }}>
                    0{idx + 1} / 02 · {p.finish}
                  </p>
                  <h3 className="font-serif text-4xl sm:text-6xl">{p.edition}</h3>
                  <p className="mt-2 font-serif text-xl italic text-gold">{p.tagline}</p>
                  <p className="mt-5 hidden max-w-md text-ivory-dim sm:block">{p.blurb}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Watch */}
            <div className="relative order-1 flex justify-center lg:order-2">
              <motion.svg style={{ rotate: ringRotate }} viewBox="0 0 200 200" className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2">
                {Array.from({ length: 120 }).map((_, i) => (
                  <line
                    key={i}
                    x1="100"
                    y1="2"
                    x2="100"
                    y2={i % 10 === 0 ? 8 : 4}
                    stroke={i % 10 === 0 ? "#c9a464" : "rgba(249,249,249,0.18)"}
                    strokeWidth={i % 10 === 0 ? 0.5 : 0.25}
                    transform={`rotate(${i * 3} 100 100)`}
                  />
                ))}
              </motion.svg>
              <motion.div style={{ rotate: watchRotate, y: watchY }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={p.slug}
                    src={p.images.cutout}
                    alt={`${p.name} ${p.edition}`}
                    className="relative h-[44vh] w-auto drop-shadow-[0_50px_60px_rgba(0,0,0,0.7)] sm:h-[58vh]"
                    initial={{ opacity: 0, rotateY: -70, scale: 0.85 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1, transition: { duration: 1.1, ease } }}
                    exit={{ opacity: 0, rotateY: 70, scale: 0.85, transition: { duration: 0.5, ease } }}
                    style={{ transformPerspective: 1200 }}
                    draggable={false}
                  />
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Price & actions */}
            <div className="order-3 flex flex-col items-start gap-5 lg:items-end lg:text-right">
              <AnimatePresence mode="wait">
                <motion.div key={p.slug + phase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease } }} exit={{ opacity: 0 }}>
                  {phase === "prebook" ? (
                    <>
                      <p className="text-sm text-ivory-mute line-through">{formatINR(p.price)}</p>
                      <p className="font-serif text-4xl">{formatINR(unitPrice(p, phase))}</p>
                      <p className="eyebrow mt-1 text-gold">Pre-booking −20%</p>
                    </>
                  ) : (
                    <>
                      <p className="font-serif text-4xl">{formatINR(p.price)}</p>
                      <p className="eyebrow mt-1 text-gold">{phase === "teaser" ? "20% off when you pre-book" : "Limited edition"}</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Magnetic>
                  <Link to={`/watch/${p.slug}`} className="btn-ghost" data-cursor="Discover">
                    Discover
                  </Link>
                </Magnetic>
                {phase !== "teaser" && (
                  <Magnetic>
                    <button onClick={() => add(p.slug)} className="btn-gold">
                      {phase === "prebook" ? "Pre-book" : "Add to selection"}
                    </button>
                  </Magnetic>
                )}
              </div>
            </div>
          </div>

          {/* Scroll progress */}
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-4">
            <span className="eyebrow tabular-nums">01</span>
            <span className="relative h-px w-40 bg-ivory/15">
              <motion.span style={{ scaleX: progressScale }} className="bg-gold absolute inset-0 origin-left" />
            </span>
            <span className="eyebrow tabular-nums">02</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
