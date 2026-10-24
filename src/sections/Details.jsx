// THE DETAILS — both watches side by side on pedestals, with a mirrored specification
// table between them. Hovering either watch highlights its column.
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { SplitReveal, FadeUp, ease } from "../components/motion.jsx";
import { Chapter, Divider } from "../components/Ornament.jsx";
import { Emblem } from "../components/Logo.jsx";
import { PRODUCTS, formatINR } from "../data/catalog.js";

const [A, B] = PRODUCTS;
// Both models list the same specification keys in the same order.
const ROWS = A.specs.map(([label, a], i) => [label, a, B.specs[i][1]]);

const FEATURES = [
  ["Architectural case design", "Octagonal, sculpted", "/images/olive-closeup.webp"],
  ["Refined dial", "Precision-inspired indices", "/images/olive-poster-closeup.webp"],
  ["Distinctive emblem", "The RUBIIK double-I", "/images/logo-green.webp"],
  ["Open-worked movement", "Automatic skeleton", "/images/skeleton-closeup.webp"],
  ["Materials & finishes", "All stainless steel", "/images/duo-flatlay.webp"],
];

export default function Details() {
  const [focus, setFocus] = useState(null);
  const [hover, setHover] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });

  const dim = (i) => (focus === null || focus === i ? "opacity-100" : "opacity-35");

  return (
    <section id="details" className="relative overflow-hidden bg-ivory py-24 text-night sm:py-36">
      <div className="damask pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-10">
        <div className="text-center">
          <Chapter n="VI" title="The details" dark center />
          <h2 className="mt-8 font-serif text-[15vw] leading-[0.9] sm:text-[8vw]">
            <span className="text-night/25">
              <SplitReveal text="Model" />
            </span>{" "}
            <SplitReveal text="ONE" delay={0.15} />
          </h2>
          <Divider className="mt-8" width="w-24 sm:w-40" />
          <FadeUp className="mx-auto mt-6 max-w-lg text-night/70">Two characters, one architecture. Compare the Automatic and the Quartz, side by side.</FadeUp>
        </div>

        {/* The pair on pedestals */}
        <div className="mt-16 grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:mt-20 sm:gap-8">
          {PRODUCTS.map((p, i) => (
            <Pedestal key={p.slug} p={p} i={i} order={i === 0 ? "order-1" : "order-3"} dim={dim(i)} onFocus={setFocus} />
          ))}
          <div className="order-2 flex h-[30vh] flex-col items-center justify-center gap-3 sm:h-[52vh]">
            <span className="h-16 w-px bg-gradient-to-b from-transparent to-gold-deep sm:h-28" />
            <Emblem className="h-8 sm:h-12" />
            <span className="h-16 w-px bg-gradient-to-t from-transparent to-gold-deep sm:h-28" />
          </div>
        </div>

        {/* Mirrored specification table */}
        <div className="frame-royal mt-16 bg-ivory/60 px-4 py-2 backdrop-blur-sm sm:mt-20 sm:px-10">
          <div className="hidden grid-cols-[1fr_14rem_1fr] border-b border-night/15 py-5 sm:grid">
            <span className={`text-right font-serif text-xl italic transition-opacity duration-500 ${dim(0)}`}>{A.edition}</span>
            <span className="eyebrow self-center text-center !text-gold-deep">Specification</span>
            <span className={`font-serif text-xl italic transition-opacity duration-500 ${dim(1)}`}>{B.edition}</span>
          </div>
          {ROWS.map(([label, a, b], i) => {
            const same = a === b;
            return (
              <motion.div
                key={label}
                className="group grid grid-cols-2 gap-x-4 border-b border-night/10 py-4 last:border-0 sm:grid-cols-[1fr_14rem_1fr] sm:py-5"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.7, ease }}
              >
                <span className="eyebrow col-span-2 mb-2 text-center !text-gold-deep sm:order-2 sm:col-span-1 sm:mb-0 sm:self-center">
                  {label}
                </span>
                {/* On phones a shared value is shown once, centred; on wider screens both columns always show. */}
                <span
                  className={`font-serif text-base transition-opacity duration-500 sm:order-1 sm:text-right sm:text-xl ${dim(0)} ${same ? "col-span-2 text-center sm:col-span-1" : "text-left"}`}
                >
                  {a}
                </span>
                <span className={`font-serif text-base transition-opacity duration-500 sm:order-3 sm:block sm:text-left sm:text-xl ${dim(1)} ${same ? "hidden" : "text-right"}`}>
                  {b}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Feature rows with a floating image that follows the pointer */}
        <div
          className="relative mt-24 sm:mt-32"
          onMouseMove={(e) => {
            x.set(e.clientX);
            y.set(e.clientY);
          }}
        >
          <p className="eyebrow mb-8 text-center !text-gold-deep">Every line has intention · Every angle has purpose</p>
          {FEATURES.map(([title, sub, img], i) => (
            <div
              key={title}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="group flex items-center justify-between gap-4 border-b border-night/15 py-6 transition-colors duration-700 hover:bg-night hover:text-ivory sm:px-8 sm:py-7"
              data-cursor="View"
            >
              <span className="flex items-baseline gap-4 sm:gap-6">
                <span className="font-serif text-sm italic text-gold-deep group-hover:text-gold">{["I", "II", "III", "IV", "V"][i]}</span>
                <span className="font-serif text-2xl transition-transform duration-700 ease-lux group-hover:translate-x-3 sm:text-5xl">{title}</span>
              </span>
              <span className="hidden text-xs uppercase tracking-wide2 opacity-60 sm:block">{sub}</span>
            </div>
          ))}
          <AnimatePresence>
            {hover !== null && (
              <motion.img
                key={hover}
                src={FEATURES[hover][2]}
                alt=""
                className="pointer-events-none fixed left-0 top-0 z-30 hidden h-72 w-56 object-cover shadow-2xl md:block"
                style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
                initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Pedestal({ p, i, order, dim, onFocus }) {
  return (
    <FadeUp delay={i * 0.15} className={`${order} transition-opacity duration-500 ${dim}`}>
      <Link
        to={`/watch/${p.slug}`}
        className="group flex flex-col items-center text-center"
        onMouseEnter={() => onFocus(i)}
        onMouseLeave={() => onFocus(null)}
        data-cursor="Discover"
      >
        <div className="relative flex h-[30vh] items-end justify-center sm:h-[52vh]">
          {/* Spotlight */}
          <div className="absolute bottom-0 left-1/2 h-[90%] w-[120%] -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: p.accent }} />
          <motion.img
            src={p.images.cutout}
            alt={`${p.name} ${p.edition}`}
            className="relative z-10 h-full w-auto drop-shadow-[0_30px_30px_rgba(0,0,0,0.35)] transition-transform duration-[1.2s] ease-lux group-hover:-translate-y-4 group-hover:scale-[1.03]"
            draggable={false}
          />
        </div>
        {/* Pedestal */}
        <div className="relative -mt-3 h-6 w-[80%] sm:h-8">
          <div className="absolute inset-0 rounded-[50%] bg-night/15 blur-md" />
          <div className="absolute inset-x-[6%] top-1/2 h-px bg-gradient-to-r from-transparent via-gold-deep to-transparent" />
        </div>
        <p className="eyebrow mt-4 !text-night/50">{p.finish}</p>
        <p className="mt-2 font-serif text-xl leading-tight sm:text-4xl">{p.edition}</p>
        <p className="mt-2 font-serif text-sm italic text-gold-deep sm:text-lg">{formatINR(p.price)}</p>
      </Link>
    </FadeUp>
  );
}
