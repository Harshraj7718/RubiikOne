// "From blueprint to reality" — a split poster. Above the line: a landscape with an engraved
// line drawing of the watch. Below: a deep panel with the finished watch. The dividing line
// rises as you scroll, so the drawing becomes the real piece.
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useShop } from "../lib/shop.jsx";
import { LAUNCH, formatINR } from "../data/catalog.js";
import { Emblem } from "../components/Logo.jsx";
import { ease } from "../components/motion.jsx";

export default function Blueprint({ product, sky, panel, quote, attribution, place, labels, flip = false }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 30 });
  // Split position (% from the top of the poster): starts low, rises past the case as you scroll.
  const split = useTransform(smooth, [0.15, 0.75], [64, 36]);
  const topClip = useTransform(split, (s) => `inset(0% 0% ${100 - s}% 0%)`);
  const bottomClip = useTransform(split, (s) => `inset(${s}% 0% 0% 0%)`);
  const splitTop = useTransform(split, (s) => `${s}%`);
  const skyY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const watchX = useTransform(scrollYProgress, [0, 1], flip ? ["4%", "-4%"] : ["-4%", "4%"]);

  const { phase } = useShop();
  const date = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
  const call =
    phase === "teaser"
      ? [`Pre-booking opens ${date(LAUNCH.prebookOpens)}`, "Reserve with a 20% privilege"]
      : phase === "prebook"
        ? ["Pre-booking now open", `${formatINR(Math.round(product.price * (1 - LAUNCH.prebookDiscount)))} · 20% privilege`]
        : ["Now available", formatINR(product.price)];

  // Both watch layers share one box so the drawing and the photo line up exactly.
  const watchBox = (src, extra = "") => (
    // On phones the watch centres a little higher to clear the text block at the bottom.
    <motion.div style={{ x: watchX }} className="absolute inset-x-0 top-0 bottom-[16%] flex items-center justify-center sm:bottom-0">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`h-[128vw] w-auto max-w-none -rotate-90 sm:h-[86vw] lg:h-[min(74vw,150vh)] ${extra}`}
      />
    </motion.div>
  );

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-night-900">
      {/* ---------- Above the line: landscape + engraved drawing ---------- */}
      <motion.div className="absolute inset-0" style={{ clipPath: topClip }}>
        <motion.img src={sky} alt="" aria-hidden="true" style={{ y: skyY }} className="absolute inset-0 h-[116%] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-night-900/55 via-night-900/10 to-night-900/40" />
        {watchBox(product.images.lineart, "opacity-95 [filter:drop-shadow(0_0_1.5px_rgba(0,0,0,0.9))]")}
      </motion.div>

      {/* ---------- Below the line: the finished watch on a deep panel ---------- */}
      <motion.div className="absolute inset-0" style={{ clipPath: bottomClip, background: panel }}>
        <Graticule />
        {watchBox(product.images.cutout, "drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]")}
      </motion.div>

      {/* The dividing rule rides the split */}
      <motion.div className="pointer-events-none absolute inset-x-0 z-10 flex -translate-y-1/2 items-center gap-3 px-4" style={{ top: splitTop }}>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
        <span className="bg-gold h-2 w-2 rotate-45" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
      </motion.div>

      {/* ---------- Typography ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-[9%] z-20 px-6 text-center">
        <motion.p
          className="mx-auto max-w-xl font-serif text-xl uppercase leading-snug tracking-[0.12em] text-ivory [text-shadow:0_2px_14px_rgba(7,12,17,0.9)] sm:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease }}
        >
          {quote}
        </motion.p>
        <p className="mt-3 font-serif text-sm italic text-gold sm:text-base">— {attribution}</p>
        <Flourish />
      </div>

      <p className={`absolute top-[30%] z-20 hidden max-w-[10rem] font-serif text-sm italic leading-snug text-ivory/80 sm:block ${flip ? "right-10 text-right" : "left-10"}`}>
        {place.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </p>

      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-7 text-center sm:pb-10">
        <div className="mx-auto mb-6 flex max-w-5xl items-end justify-between">
          <Badge>{labels[0]}</Badge>
          <Badge>{labels[1]}</Badge>
        </div>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <CompassRose className="hidden h-28 w-28 shrink-0 sm:block" />
          <div className="flex-1">
            <p className="font-serif text-lg uppercase tracking-[0.18em] sm:text-2xl">{call[0]}</p>
            <p className="mt-1 font-serif text-base italic text-gold sm:text-xl">{call[1]}</p>
            <Link to={`/watch/${product.slug}`} className="btn-ghost pointer-events-auto mt-5 !px-7 !py-3" data-cursor="Discover">
              Discover <span className="hidden sm:inline">the {product.edition}</span>
            </Link>
          </div>
          <Globe className="hidden h-28 w-28 shrink-0 sm:block" />
        </div>
        <div className="mx-auto mt-7 flex max-w-3xl items-center gap-3 border-y border-gold/40 py-2 sm:gap-5">
          <span className="flex-1 whitespace-nowrap text-right text-[9px] uppercase tracking-[0.18em] text-ivory-mute sm:text-[11px] sm:tracking-wide2">Est. MMXXVI</span>
          <span className="bg-gold h-1.5 w-1.5 shrink-0 rotate-45" />
          <span className="flex items-center gap-2 font-serif text-lg tracking-[0.24em] sm:text-3xl sm:tracking-[0.3em]">
            <Emblem className="h-4 sm:h-6" />
            RUBIIK
          </span>
          <span className="bg-gold h-1.5 w-1.5 shrink-0 rotate-45" />
          <span className="flex-1 whitespace-nowrap text-left text-[9px] uppercase tracking-[0.18em] text-ivory-mute sm:text-[11px] sm:tracking-wide2">200 pieces</span>
        </div>
      </div>
    </section>
  );
}

function Badge({ children }) {
  return <span className="font-serif text-xs italic text-ivory/85 sm:text-base">• {children} •</span>;
}

/** Latitude/longitude lines, like an old navigator's chart. */
function Graticule() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.16]" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="#c9a464" strokeWidth="0.12" vectorEffect="non-scaling-stroke">
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={`h${i}`} d={`M0 ${40 + i * 7} Q50 ${34 + i * 7} 100 ${40 + i * 7}`} />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <path key={`v${i}`} d={`M${i * 8.33} 35 Q${50 + (i * 8.33 - 50) * 0.75} 70 ${i * 8.33} 100`} />
        ))}
      </g>
    </svg>
  );
}

function Flourish() {
  return (
    <svg viewBox="0 0 200 20" className="mx-auto mt-3 h-4 w-40 sm:h-5 sm:w-52" aria-hidden="true">
      <g fill="none" stroke="#c9a464" strokeWidth="0.8">
        <path d="M100 10 C88 0 74 0 68 10 C62 20 48 20 40 10 M40 10 L4 10" />
        <path d="M100 10 C112 0 126 0 132 10 C138 20 152 20 160 10 M160 10 L196 10" />
      </g>
      <rect x="96" y="6" width="8" height="8" transform="rotate(45 100 10)" fill="#c9a464" />
    </svg>
  );
}

function CompassRose({ className }) {
  const point = (deg, len, w) => <path key={deg} d={`M50 50 L${50 - w} 50 L50 ${50 - len} L${50 + w} 50 Z`} transform={`rotate(${deg} 50 50)`} />;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke="#c9a464" strokeWidth="0.6">
        <circle cx="50" cy="50" r="44" />
        <circle cx="50" cy="50" r="38" strokeDasharray="1 2" />
      </g>
      <g fill="#c9a464" opacity="0.9">{[0, 90, 180, 270].map((d) => point(d, 40, 5))}</g>
      <g fill="#c9a464" opacity="0.5">{[45, 135, 225, 315].map((d) => point(d, 26, 4))}</g>
      <text x="50" y="5" textAnchor="middle" fill="#ecd29c" style={{ font: "8px 'Cormorant Garamond', serif" }}>N</text>
    </svg>
  );
}

function Globe({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke="#c9a464" strokeWidth="0.6">
        <circle cx="50" cy="50" r="42" />
        {[14, 28, 42].map((rx) => (
          <ellipse key={rx} cx="50" cy="50" rx={rx} ry="42" />
        ))}
        {[-28, -14, 0, 14, 28].map((y) => {
          const half = Math.sqrt(42 * 42 - y * y);
          return <line key={y} x1={50 - half} y1={50 + y} x2={50 + half} y2={50 + y} />;
        })}
      </g>
    </svg>
  );
}
