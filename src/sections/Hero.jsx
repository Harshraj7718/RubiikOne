// Hero: an editorial split. Copy and calls to action on one side; on the other, both watches
// crossed inside a gold dial whose second hand ticks in real time, under a spotlight of gold dust.
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ease, Magnetic } from "../components/motion.jsx";
import Particles from "../components/Particles.jsx";
import GlyphSwell from "@/components/ui/glyph-swell";
import { useShop } from "../lib/shop.jsx";
import { useCountdown, pad } from "../lib/hooks.js";
import { scrollToId } from "../App.jsx";

const NUMERALS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
// Module-level so the glyph field isn't rebuilt on every countdown tick.
const GLYPH_COLORS = ["#050c09", "#b8935a", "#f6e3b4"];
const GLYPH_RAMP = "·:+×*✦";

export default function Hero({ ready }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 30 });
  const dialRotate = useTransform(p, [0, 1], [0, 75]);
  const stageY = useTransform(p, [0, 1], ["0%", "18%"]);
  const stageScale = useTransform(p, [0, 1], [1, 0.9]);
  const leftY = useTransform(p, [0, 1], [0, -90]);
  const rightY = useTransform(p, [0, 1], [0, -40]);
  const copyY = useTransform(p, [0, 1], ["0%", "-25%"]);
  const fade = useTransform(p, [0, 0.7], [1, 0]);

  // Pointer parallax: the front watch moves more than the back one.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 70, damping: 18 };
  const frontX = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), spring);
  const frontY = useSpring(useTransform(my, [-0.5, 0.5], [-14, 14]), spring);
  const backX = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring);
  const backY = useSpring(useTransform(my, [-0.5, 0.5], [-6, 6]), spring);
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring);

  const { phase, status } = useShop();
  const target = phase === "teaser" ? status.launch.prebookOpens : status.launch.launch;
  const t = useCountdown(target);
  const show = ready ? "show" : "hidden";
  const now = new Date();

  return (
    <section
      ref={ref}
      className="grain relative min-h-[100svh] overflow-hidden"
      onMouseMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      {/* Atmosphere: a field of gold glyphs that swell from the pointer, an emerald glow,
          a spotlight from above and drifting gold dust */}
      <div className="absolute inset-0">
        <GlyphSwell colors={GLYPH_COLORS} ramp={GLYPH_RAMP} cell={18} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(23,51,39,0.45)_0%,rgba(11,26,20,0.12)_50%,rgba(5,12,9,0.7)_100%)]" />
      <div className="pointer-events-none absolute -top-1/4 right-[8%] h-[120%] w-[60%] bg-[radial-gradient(ellipse_at_top,rgba(236,210,156,0.16),transparent_60%)] blur-2xl" />
      <Particles mode="dust" density={1.1} />

      <div className="relative mx-auto grid min-h-[100svh] max-w-[1600px] items-center gap-6 px-5 pb-28 pt-24 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pb-24">
        {/* ---------- Copy ---------- */}
        <motion.div
          style={{ y: copyY, opacity: fade }}
          className="order-2 text-center lg:order-1 lg:text-left"
          initial="hidden"
          animate={show}
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }}
        >
          <motion.div variants={item} className="flex items-center justify-center gap-3 lg:justify-start">
            <span className="h-px w-8 bg-gold" />
            <span className="eyebrow whitespace-nowrap text-gold">The Signature Collection</span>
            <span className="bg-gold hidden h-1.5 w-1.5 shrink-0 rotate-45 sm:block" />
            <span className="eyebrow hidden whitespace-nowrap sm:block">Est. MMXXVI</span>
            <span className="h-px w-8 bg-gold lg:hidden" />
          </motion.div>

          <h1 className="mt-6 font-serif text-[13vw] leading-[0.92] sm:text-7xl xl:text-[6.6rem]">
            <MaskLine ready={ready} delay={0.6}>
              Every second
            </MaskLine>
            <MaskLine ready={ready} delay={0.75}>
              has a <span className="italic text-gold">shape.</span>
            </MaskLine>
          </h1>

          <motion.p variants={item} className="mx-auto mt-7 max-w-md text-base leading-relaxed text-ivory-dim sm:text-lg lg:mx-0">
            RUBIIK ONE — an automatic skeleton and a quartz olive, sharing one numbered edition of only 200 pieces. Revealed this Christmas.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Magnetic>
              <button onClick={() => scrollToId("prebook")} className="btn-gold" data-cursor="Reserve">
                {phase === "launched" ? "Shop the edition" : "Reserve yours"}
              </button>
            </Magnetic>
            <Magnetic>
              <button onClick={() => scrollToId("collection")} className="btn-ghost">
                Discover the collection
              </button>
            </Magnetic>
          </motion.div>

          <motion.dl variants={item} className="mx-auto mt-12 grid max-w-md grid-cols-3 border-t border-gold/20 pt-6 lg:mx-0">
            {[
              ["200", "Numbered pieces"],
              ["20%", "Pre-booking privilege"],
              ["25·XII", "Christmas launch"],
            ].map(([v, l], i) => (
              <div key={l} className={`px-2 ${i ? "border-l border-gold/20" : ""}`}>
                <dt className="font-serif text-3xl text-gold sm:text-4xl">{v}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ivory-mute">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* ---------- The dial stage ---------- */}
        <motion.div style={{ y: stageY, scale: stageScale }} className="relative order-1 mx-auto aspect-square w-[88vw] max-w-[680px] lg:order-2 lg:w-full">
          <motion.div
            className="absolute inset-0"
            style={{ rotate: dialRotate }}
            initial={{ opacity: 0, scale: 0.85, rotate: -30 }}
            animate={ready ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 2.2, ease, delay: 0.2 }}
          >
            <Dial />
          </motion.div>

          {/* Real-time second hand: ticks once per second, synced to the clock */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : {}}
            transition={{ delay: 1.4, duration: 1 }}
            style={{ animation: "spin-slow 60s steps(60) infinite", animationDelay: `-${now.getSeconds()}s` }}
          >
            <span className="absolute bottom-1/2 left-1/2 h-[46%] w-px -translate-x-1/2 origin-bottom bg-gradient-to-t from-gold/0 via-gold/70 to-gold-light" />
            <span className="bg-gold absolute left-1/2 top-[4%] h-2 w-2 -translate-x-1/2 rotate-45" />
          </motion.div>

          {/* Crossed pair */}
          <motion.div style={{ rotateY: tiltY, transformPerspective: 1400 }} className="absolute inset-0">
            <motion.div style={{ x: backX, y: backY }} className="absolute inset-0">
              <motion.div style={{ y: rightY }} className="absolute left-[44%] top-[12%] h-[76%]">
                <motion.img
                  src="/images/olive-watch.webp"
                  alt="RUBIIK ONE Quartz Olive in brushed olive steel"
                  className="h-full w-auto drop-shadow-[0_40px_50px_rgba(0,0,0,0.7)]"
                  initial={{ opacity: 0, y: 120, rotate: 30 }}
                  animate={ready ? { opacity: 1, y: 0, rotate: 14 } : {}}
                  transition={{ duration: 1.8, ease, delay: 0.75 }}
                  draggable={false}
                />
              </motion.div>
            </motion.div>
            <motion.div style={{ x: frontX, y: frontY }} className="absolute inset-0">
              <motion.div style={{ y: leftY }} className="absolute left-[14%] top-[10%] h-[80%]">
                <motion.img
                  src="/images/skeleton-watch.webp"
                  alt="RUBIIK ONE Automatic Skeleton in sandblasted gunmetal"
                  className="h-full w-auto drop-shadow-[0_50px_60px_rgba(0,0,0,0.8)]"
                  initial={{ opacity: 0, y: 140, rotate: -30 }}
                  animate={ready ? { opacity: 1, y: 0, rotate: -12 } : {}}
                  transition={{ duration: 1.8, ease, delay: 0.55 }}
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Floor reflection */}
          <div className="pointer-events-none absolute bottom-[2%] left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-[50%] bg-black/60 blur-2xl" />
        </motion.div>
      </div>

      {/* ---------- Bottom bar: edition, countdown, scroll cue ---------- */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute inset-x-0 bottom-0 z-10 border-t border-gold/15 bg-night-900/40 backdrop-blur-sm"
        initial={{ y: "100%" }}
        animate={ready ? { y: 0 } : {}}
        transition={{ duration: 1.2, ease, delay: 1.3 }}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-10">
          <span className="eyebrow hidden sm:block">RUBIIK ONE · Limited to 200</span>
          <button onClick={() => scrollToId("prebook")} className="flex flex-1 items-center justify-center gap-3 sm:flex-none" data-cursor="Reserve">
            <span className="eyebrow text-gold">{phase === "teaser" ? "Pre-booking opens in" : phase === "prebook" ? "Christmas launch in" : "Now available"}</span>
            {phase !== "launched" && (
              <span className="font-serif text-lg tabular-nums sm:text-xl">
                {t.days}d {pad(t.hours)}h {pad(t.minutes)}m {pad(t.seconds)}s
              </span>
            )}
          </button>
          <button onClick={() => scrollToId("philosophy")} className="eyebrow hidden items-center gap-3 sm:flex" aria-label="Scroll">
            Scroll
            <span className="relative h-6 w-px overflow-hidden bg-ivory/15">
              <motion.span className="bg-gold absolute inset-x-0 top-0 h-1/2" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}

const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 1.1, ease } } };

function MaskLine({ children, ready, delay }) {
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span className="block" initial={{ y: "105%" }} animate={ready ? { y: 0 } : {}} transition={{ duration: 1.3, ease, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

/** Engraved dial: minute track, hour batons, Roman numerals and an inner chapter ring. */
function Dial() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="dial-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1dcaa" />
          <stop offset="0.5" stopColor="#c9a464" />
          <stop offset="1" stopColor="#8c6a35" />
        </linearGradient>
        <radialGradient id="dial-face">
          <stop offset="0.55" stopColor="rgba(23,51,39,0.55)" />
          <stop offset="1" stopColor="rgba(5,12,9,0)" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#dial-face)" />
      <circle cx="200" cy="200" r="196" fill="none" stroke="url(#dial-gold)" strokeWidth="1" />
      <circle cx="200" cy="200" r="188" fill="none" stroke="rgba(201,164,100,0.35)" strokeWidth="0.5" />
      {Array.from({ length: 60 }).map((_, i) => (
        <line
          key={i}
          x1="200"
          y1={i % 5 === 0 ? 10 : 12}
          x2="200"
          y2={i % 5 === 0 ? 26 : 18}
          stroke={i % 5 === 0 ? "url(#dial-gold)" : "rgba(239,233,223,0.35)"}
          strokeWidth={i % 5 === 0 ? 2 : 0.7}
          transform={`rotate(${i * 6} 200 200)`}
        />
      ))}
      {NUMERALS.map((n, i) => {
        const a = (i * 30 - 90) * (Math.PI / 180);
        return (
          <text
            key={n}
            x={200 + Math.cos(a) * 156}
            y={200 + Math.sin(a) * 156 + 5}
            textAnchor="middle"
            fill="url(#dial-gold)"
            style={{ font: "italic 15px 'Cormorant Garamond', serif", letterSpacing: "1px" }}
          >
            {n}
          </text>
        );
      })}
      <circle cx="200" cy="200" r="134" fill="none" stroke="rgba(201,164,100,0.25)" strokeWidth="0.5" strokeDasharray="2 4" />
      <circle cx="200" cy="200" r="3" fill="url(#dial-gold)" />
    </svg>
  );
}
