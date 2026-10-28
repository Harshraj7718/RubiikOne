// Hero: a giant outlined "RUBIIK" behind both watches, which overlap on a dark glossy floor with
// reflections and droplets; the headline and calls to action sit on the right. Dark silk, drifting
// dust and gold-vein corners set the atmosphere.
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ease, Magnetic } from "../components/motion.jsx";
import Particles from "../components/Particles.jsx";
import GoldVeins from "../components/GoldVeins.jsx";
import { ShaderBackground } from "@/components/ui/silk-shader";
import { PRODUCTS, LAUNCH, formatINR, formatDate, unitPrice, GST_LABEL } from "../data/catalog.js";
import { Toran, Diya, SilkBanner } from "../components/Dhanteras.jsx";
import { useShop } from "../lib/shop.jsx";
import { useCountdown, useFestive, pad } from "../lib/hooks.js";
import { scrollToId } from "../App.jsx";

const [AUTOMATIC, QUARTZ] = PRODUCTS;
// The lower-priced model, quoted as the pre-booking "from" price.
const ENTRY = PRODUCTS.reduce((a, b) => (b.price < a.price ? b : a));
// Droplets on the floor: [left %, bottom %, width px, height px]
const DROPS = [
  [8, 10, 26, 8],
  [17, 4, 14, 5],
  [30, 14, 18, 6],
  [44, 3, 34, 10],
  [58, 11, 12, 4],
  [69, 5, 22, 7],
  [83, 12, 16, 5],
  [92, 6, 10, 4],
];

export default function Hero({ ready }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 30 });
  const pairY = useTransform(p, [0, 1], ["0%", "-12%"]);
  const wordX = useTransform(p, [0, 1], ["0%", "-8%"]);
  const copyY = useTransform(p, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(p, [0, 0.7], [1, 0]);

  // Pointer parallax: the front watch moves more than the back one.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 70, damping: 18 };
  const frontX = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), spring);
  const frontY = useSpring(useTransform(my, [-0.5, 0.5], [-8, 8]), spring);
  const backX = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), spring);

  const { phase, status } = useShop();
  // Turns itself off at the end of 7 November, so the hero goes back to normal without a reload.
  const festive = useFestive();

  return (
    <section
      ref={ref}
      className="grain relative h-[100svh] min-h-[640px] overflow-hidden"
      onMouseMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      {/* Atmosphere: dark silk (#0B1321 if WebGL is unavailable), a deep vignette, drifting dust, vein corners */}
      <div className="absolute inset-0 bg-[#0B1321]">
        <ShaderBackground className="absolute inset-0" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_38%_50%,rgba(11,19,33,0.15)_0%,rgba(6,11,19,0.55)_55%,rgba(4,8,14,0.9)_100%)]" />
      <Particles tone="white" density={0.8} />
      {festive && (
        // Dhanteras: a warm lamp-glow behind the copy and a slim marigold toran under the menu bar.
        <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_55%,rgba(232,162,58,0.16),transparent_55%)]" />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={ready ? { opacity: 0.85, y: 0 } : {}}
            transition={{ duration: 1.2, ease, delay: 1 }}
            className="absolute left-1/2 top-16 w-[150%] max-w-5xl -translate-x-1/2 sm:w-[90%]"
          >
            <Toran className="block w-full" />
          </motion.div>
        </motion.div>
      )}
      {/* will-change keeps the veins on their own layer, so fading them on scroll doesn't re-run their filters. */}
      <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-0 will-change-[opacity]">
        <GoldVeins corner="top-right" ready={ready} className="!top-16 h-auto w-[64vw] max-w-[560px] sm:!top-0 sm:w-[40vw] lg:w-[30vw]" />
        <GoldVeins corner="bottom-left" ready={ready} className="h-auto w-[56vw] max-w-[500px] sm:w-[36vw] lg:w-[26vw]" />
      </motion.div>

      {/* Vertical brand label at the left edge */}
      <motion.div
        style={{ opacity: fade }}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1.4 }}
        className="absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 sm:flex lg:left-8"
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-ivory/50 [writing-mode:vertical-rl] rotate-180">RUBIIK</span>
        <span className="h-16 w-px bg-ivory/30" />
      </motion.div>

      <div className="relative mx-auto grid h-full max-w-[1600px] grid-rows-[1fr_auto] px-5 pb-8 pt-20 sm:px-10 lg:grid-cols-[1.25fr_1fr] lg:grid-rows-1 lg:items-center lg:gap-6 lg:pb-0 lg:pt-16">
        {/* ---------- Left: outlined name behind the pair on a glossy floor ---------- */}
        {/* lg:pl-14 keeps the tilted watch clear of the vertical label at the left edge */}
        <div className="relative flex min-h-0 items-center justify-center lg:pl-14">
          <motion.div
            style={{ x: wordX, opacity: fade }}
            className="pointer-events-none absolute inset-x-0 top-0 flex select-none justify-center font-serif uppercase leading-none lg:top-[10%] lg:justify-start"
            aria-hidden="true"
          >
            {[..."RUBIIK"].map((ch, i) => (
              <span key={i} className="overflow-hidden">
                <motion.span
                  className="block text-[23vw] sm:text-[18vw] lg:text-[min(14vw,28vh)]"
                  style={{ color: "transparent", WebkitTextStroke: i === 3 || i === 4 ? "1.5px rgba(212,172,98,0.8)" : "1.5px rgba(249,249,249,0.32)" }}
                  initial={{ y: "100%" }}
                  animate={ready ? { y: 0 } : {}}
                  transition={{ duration: 1.5, ease, delay: 0.2 + i * 0.07 }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </motion.div>

          {/* The pair */}
          {/* On phones the pair sits lower so the outlined name reads above it. */}
          <motion.div style={{ y: pairY }} className="relative mt-[14vw] h-[37svh] w-full max-w-[640px] sm:mt-[10vw] lg:mt-0 lg:h-[60vh]">
            {/* Glossy floor: a sheen line, a pool of light and droplets */}
            <div className="pointer-events-none absolute -inset-x-[20%] bottom-[-14%] h-[34%]">
              <div className="absolute inset-x-[10%] top-[38%] h-px bg-gradient-to-r from-transparent via-ivory/25 to-transparent" />
              <div className="absolute inset-x-[15%] top-[20%] h-[50%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(249,249,249,0.08),transparent_70%)]" />
              {DROPS.map(([left, bottom, w, h], i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-[50%] bg-[radial-gradient(ellipse_at_35%_30%,rgba(255,255,255,0.55),rgba(255,255,255,0.08)_45%,rgba(0,0,0,0.5)_100%)] shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                  style={{ left: `${left}%`, bottom: `${bottom}%`, width: w, height: h }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={ready ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8, delay: 1.2 + i * 0.06 }}
                />
              ))}
            </div>

            <Watch
              product={AUTOMATIC}
              className="left-[4%] top-0 z-0 h-[92%]"
              rotate={-14}
              x={backX}
              ready={ready}
              delay={0.45}
            />
            <Watch
              product={QUARTZ}
              className="left-[40%] top-[10%] z-10 h-[88%]"
              rotate={12}
              x={frontX}
              y={frontY}
              ready={ready}
              delay={0.65}
            />
          </motion.div>
        </div>

        {/* ---------- Right: headline and calls to action ---------- */}
        <motion.div
          style={{ y: copyY, opacity: fade }}
          className="relative z-20 text-center lg:text-left"
          initial="hidden"
          animate={ready ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.8 } } }}
        >
          {festive ? (
            // The launch date on a banner of red silk rippling in the air.
            <motion.div variants={item} className="mb-4 flex justify-center lg:mb-0 lg:justify-start">
              <SilkBanner className="px-5 py-3 sm:px-7 sm:py-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <Diya className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-[0.35em] text-gold-light sm:text-[10px]">Launching on Dhanteras</p>
                    <p className="mt-1 whitespace-nowrap font-serif text-[1.7rem] leading-none text-ivory [text-shadow:0_2px_8px_rgba(60,0,0,0.6)] sm:text-4xl">
                      {formatDate(LAUNCH.launch, { day: "numeric", month: undefined })}{" "}
                      <span className="italic text-gold-light">{formatDate(LAUNCH.launch, { day: undefined, month: "long" })}</span>{" "}
                      {new Date(LAUNCH.launch).getFullYear()}
                    </p>
                  </div>
                  <Diya className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" delay={0.5} />
                </div>
                {/* The offer only applies until launch, so it leaves the banner once the watches are out. */}
                {phase !== "launched" && (
                  <p className="mx-auto mt-2 w-fit whitespace-nowrap border-t border-gold-light/40 pt-1.5 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-gold-light sm:text-[11px] sm:tracking-[0.25em]">
                    Pre-book now · get <span className="text-ivory">{Math.round(LAUNCH.prebookDiscount * 100)}% off</span> before launch
                  </p>
                )}
              </SilkBanner>
            </motion.div>
          ) : (
            <motion.p variants={item} className="eyebrow hidden lg:block">
              The signature collection · Est. MMXXVI
            </motion.p>
          )}
          <motion.h1 variants={item} className="font-serif text-[2.6rem] font-medium uppercase leading-[0.95] tracking-[0.04em] sm:text-6xl lg:mt-5 lg:text-[min(5.2rem,9vh)]">
            RUBIIK ONE:
          </motion.h1>
          <motion.p variants={item} className="mt-1.5 whitespace-nowrap font-serif text-[0.95rem] uppercase tracking-[0.14em] text-gold sm:whitespace-normal sm:text-3xl sm:tracking-[0.12em] lg:mt-2 lg:text-[min(2.4rem,4.4vh)]">
            Precision in every dimension
          </motion.p>
          <motion.p variants={item} className="mx-auto mt-4 hidden max-w-md text-ivory-dim sm:block lg:mx-0 lg:mt-6">
            An automatic skeleton and a quartz olive, each in its own numbered edition of only {LAUNCH.editionPerModel} pieces.{" "}
            {phase === "teaser"
              ? `Pre-booking opens on ${formatDate(LAUNCH.prebookOpens)}; the edition launches on ${formatDate(LAUNCH.launch)}.`
              : phase === "prebook"
                ? `Pre-booking is open now; the edition launches on ${formatDate(LAUNCH.launch)}.`
                : `Launched on ${formatDate(LAUNCH.launch)}; available while pieces last.`}
          </motion.p>
          <motion.p variants={item} className="mt-3 text-[13px] text-ivory-dim sm:hidden">
            {phase === "launched" ? "From" : "Pre-book from"}{" "}
            <span className="text-ivory">{formatINR(phase === "launched" ? ENTRY.price : unitPrice(ENTRY, "prebook"))}</span> {GST_LABEL}
          </motion.p>
          <motion.div variants={item} className="mt-3 hidden text-sm text-ivory-dim sm:block lg:mt-5">
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 lg:justify-start">
              {PRODUCTS.map((p) => (
                <span key={p.slug}>
                  {p.edition} <span className="text-ivory">{formatINR(p.price)}</span>
                </span>
              ))}
              <span>{GST_LABEL}</span>
            </p>
            {phase !== "launched" && (
              <p className="mt-1 text-gold-light">
                {Math.round(LAUNCH.prebookDiscount * 100)}% off when you pre-book · from {formatINR(unitPrice(ENTRY, "prebook"))} {GST_LABEL}
              </p>
            )}
          </motion.div>
          <motion.div variants={item} className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:mt-5 lg:mt-7 lg:justify-start">
            <Magnetic>
              <button onClick={() => scrollToId("prebook")} className="btn-gold !px-6 !py-3 sm:!px-7 sm:!py-3.5" data-cursor="Reserve">
                {phase === "launched" ? "Shop the edition" : "Reserve yours"}
              </button>
            </Magnetic>
            <Magnetic>
              <button onClick={() => scrollToId("collection")} className="btn-ghost !px-6 !py-3 sm:!px-7 sm:!py-3.5">
                Explore
              </button>
            </Magnetic>
          </motion.div>
          {phase !== "launched" && (
            <motion.p variants={item} className="mt-5 hidden text-[10px] uppercase tracking-[0.3em] text-ivory-mute sm:block lg:mt-8">
              {phase === "teaser" ? "Pre-booking opens in" : "Launch in"}{" "}
              <span className="ml-2 font-serif text-base normal-case tracking-normal text-ivory tabular-nums">
                <Countdown iso={phase === "teaser" ? status.launch.prebookOpens : status.launch.launch} />
              </span>
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Only this text re-renders every second, not the whole hero.
function Countdown({ iso }) {
  const t = useCountdown(iso);
  return (
    <>
      {t.days}d {pad(t.hours)}h {pad(t.minutes)}m {pad(t.seconds)}s
    </>
  );
}

const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 1.1, ease } } };

/** One watch with its mirrored reflection in the glossy floor. */
function Watch({ product, className, rotate, x, y, ready, delay }) {
  return (
    <motion.div style={{ x, y }} className={`absolute ${className}`}>
      <motion.div
        className="relative h-full"
        initial={{ opacity: 0, y: 80, rotate: rotate * 2 }}
        animate={ready ? { opacity: 1, y: 0, rotate } : {}}
        transition={{ duration: 1.6, ease, delay }}
      >
        <img src={product.images.cutout} alt={`${product.name} ${product.edition}`} className="relative h-full w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)]" draggable={false} />
        {/* Reflection: the same image flipped, fading out quickly */}
        <img
          src={product.images.cutout}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-full h-full w-auto -scale-y-100 opacity-25 blur-[1px] [mask-image:linear-gradient(to_top,rgba(0,0,0,0.9),transparent_35%)]"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}
