// Opening sequence: a dial ring fills while the wordmark assembles, then the curtain lifts.
import { useEffect, useRef, useState } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { Emblem } from "./Logo.jsx";
import { ease } from "./motion.jsx";

// Only what the first screen needs: the two hero watches (small cut-outs) and the fonts.
// Everything else loads in the background or as the visitor scrolls.
const CRITICAL = ["/images/skeleton-watch.webp", "/images/olive-watch.webp"];
const MAX_WAIT_MS = 2200;

export default function Loader({ onDone }) {
  const progress = useMotionValue(0);
  const dash = useTransform(progress, [0, 100], [1, 0]);
  const [pct, setPct] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const steps = [...CRITICAL.map((src) => new Promise((res) => Object.assign(new Image(), { onload: res, onerror: res, src }))), document.fonts?.ready ?? Promise.resolve()];
    let finished = 0;
    for (const p of steps) p.then(() => animate(progress, (++finished / steps.length) * 100, { duration: 0.35, ease }));
    let ended = false;
    const unsub = progress.on("change", (v) => {
      setPct(Math.round(v));
      if (v >= 99.5 && !ended) {
        ended = true;
        setTimeout(() => done.current(), 120);
      }
    });
    // Never hold the visitor back on a slow network.
    const failSafe = setTimeout(() => animate(progress, 100, { duration: 0.3 }), MAX_WAIT_MS);
    return () => {
      unsub();
      clearTimeout(failSafe);
    };
  }, [progress]);

  const letters = ["R", "U", "B", "I", "I", "K"];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-night-900"
      exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.8, ease } }}
      initial={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <svg viewBox="0 0 200 200" className="absolute h-[78vmin] w-[78vmin] -rotate-90">
        <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(249,249,249,0.08)" strokeWidth="0.4" />
        <motion.circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke="url(#loader-gold)"
          strokeWidth="0.6"
          pathLength="1"
          strokeDasharray="1"
          style={{ strokeDashoffset: dash }}
        />
        {Array.from({ length: 60 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1={i % 5 === 0 ? 8 : 6}
            x2="100"
            y2="4"
            stroke="rgba(249,249,249,0.25)"
            strokeWidth={i % 5 === 0 ? 0.5 : 0.25}
            transform={`rotate(${i * 6} 100 100)`}
          />
        ))}
        <defs>
          <linearGradient id="loader-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ecd29c" />
            <stop offset="1" stopColor="#8c6a35" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative flex flex-col items-center gap-6">
        <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, ease }} style={{ originY: 0 }}>
          <Emblem className="h-14" animate />
        </motion.div>
        <div className="flex gap-[0.35em] font-serif text-4xl sm:text-6xl">
          {letters.map((l, i) => (
            <span key={i} className="overflow-hidden">
              <motion.span
                className={`inline-block ${i === 3 || i === 4 ? "text-gold" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease, delay: 0.1 + i * 0.05 }}
              >
                {l}
              </motion.span>
            </span>
          ))}
        </div>
        <span className="eyebrow tabular-nums">{String(pct).padStart(3, "0")} — Precision loading</span>
      </div>
    </motion.div>
  );
}
