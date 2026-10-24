// V — "A Form of Its Own." A pinned, full-screen sequence: each campaign image becomes the
// section's background and is revealed over the previous one by a curtain wipe as you scroll.
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Chapter } from "../components/Ornament.jsx";
import { ease } from "../components/motion.jsx";
import { responsive } from "../lib/img.js";

// `focus` keeps the watch in frame when a landscape image is cropped to a portrait phone.
const SCENES = [
  { src: "/images/skeleton-desert.webp", focus: "58% 60%", title: "Forged for every horizon.", note: "Sandblasted gunmetal, untouched by the elements.", model: "Automatic Skeleton" },
  { src: "/images/olive-silk.webp", focus: "50% 50%", title: "Every line has intention.", note: "A brushed olive case, sculpted like fabric in motion.", model: "Quartz Olive" },
  { src: "/images/skeleton-underwater.webp", focus: "76% 55%", title: "Made to be worn.", note: "Water resistant to 5 ATM. All stainless steel.", model: "Automatic Skeleton" },
  { src: "/images/olive-voyage.webp", focus: "55% 62%", title: "Every angle has purpose.", note: "Architectural proportions that hold the light at golden hour.", model: "Quartz Olive" },
  { src: "/images/skeleton-compass.webp", focus: "64% 50%", title: "Complexity, made beautiful.", note: "An open-worked calibre, revealed through the dial.", model: "Automatic Skeleton" },
  { src: "/images/olive-driftwood.webp", focus: "50% 45%", title: "Your time. Your perspective.", note: "A silhouette that speaks without saying too much.", model: "Quartz Olive" },
];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
// Scenes are full-bleed and zoomed to 1.25; on portrait screens a landscape photo is drawn by
// height, so it needs far more pixels than the screen is wide.
const SCENE_SIZES = "(orientation: portrait) 190vh, 125vw";

export default function Gallery() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const steps = SCENES.length - 1;
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(steps, Math.max(0, Math.round(v * steps)))));

  const scene = SCENES[active];
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="design" ref={ref} className="relative" style={{ height: `${SCENES.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-night-900">
        {/* Full-bleed backgrounds, stacked; each one wipes up over the last */}
        {SCENES.map((s, i) => (
          <Scene key={s.src} scene={s} i={i} steps={steps} progress={scrollYProgress} />
        ))}

        {/* Legibility veils */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-900/95 via-night-900/20 to-night-900/60" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-night-900 via-night-900/80 to-transparent sm:hidden" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night-900/70 via-transparent to-transparent" />

        {/* Engraved inner frame */}
        <div className="pointer-events-none absolute inset-3 border border-gold/25 sm:inset-6">
          {["-left-[5px] -top-[5px]", "-right-[5px] -top-[5px]", "-bottom-[5px] -left-[5px]", "-bottom-[5px] -right-[5px]"].map((pos) => (
            <span key={pos} className={`bg-gold absolute h-[9px] w-[9px] rotate-45 ${pos}`} />
          ))}
        </div>

        {/* Section title */}
        <div className="absolute left-6 right-6 top-20 sm:left-14 sm:top-24">
          <Chapter n="V" title="The design" className="mb-4" />
          <h2 className="font-serif text-4xl leading-none sm:text-7xl">
            A Form of <span className="italic text-gold">Its Own.</span>
          </h2>
        </div>

        {/* Caption for the scene in view */}
        <div className="absolute bottom-10 left-6 right-10 sm:bottom-20 sm:left-14 sm:right-auto sm:max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial="hidden" animate="show" exit="exit">
              <motion.p
                className="eyebrow mb-4 text-gold"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } }, exit: { opacity: 0, transition: { duration: 0.3 } } }}
              >
                {NUMERALS[active]} · RUBIIK ONE {scene.model}
              </motion.p>
              <h3 className="overflow-hidden font-serif text-[2.1rem] leading-[1.02] sm:text-7xl">
                <motion.span
                  className="block"
                  variants={{ hidden: { y: "105%" }, show: { y: 0, transition: { duration: 1.1, ease } }, exit: { y: "-105%", transition: { duration: 0.45, ease } } }}
                >
                  {scene.title}
                </motion.span>
              </h3>
              <motion.p
                className="mt-3 max-w-md text-sm text-ivory-dim sm:mt-4 sm:text-lg"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1, delay: 0.25 } }, exit: { opacity: 0, transition: { duration: 0.25 } } }}
              >
                {scene.note}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Numeral index with progress */}
        <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-14">
          {NUMERALS.map((n, i) => (
            <span key={n} className={`flex items-center gap-3 font-serif text-sm transition-all duration-700 ${i === active ? "text-gold" : "text-ivory/35"}`}>
              <span className={`h-px bg-gold transition-all duration-700 ${i === active ? "w-8 opacity-100" : "w-0 opacity-0"}`} />
              <span className="hidden sm:inline">{n}</span>
              <span className={`h-1.5 w-1.5 rotate-45 border border-gold sm:hidden ${i === active ? "bg-gold" : ""}`} />
            </span>
          ))}
        </div>
        <motion.div style={{ scaleX: progress }} className="bg-gold absolute inset-x-3 bottom-3 h-px origin-left sm:inset-x-6 sm:bottom-6" />
      </div>
    </section>
  );
}

function Scene({ scene, i, steps, progress }) {
  // Scene i wipes in across the scroll segment before it, then keeps drifting while it holds.
  const start = (i - 1) / steps;
  const end = i / steps;
  const reveal = useTransform(progress, [start, end], [100, 0], { clamp: true });
  const clipPath = useTransform(reveal, (r) => `inset(${r}% 0% 0% 0%)`);
  const scale = useTransform(progress, [Math.max(0, start), Math.min(1, end + 1 / steps)], [1.25, 1.02]);
  const y = useTransform(progress, [Math.max(0, start), Math.min(1, end + 1 / steps)], ["8%", "-4%"]);
  const edgeTop = useTransform(reveal, (r) => `${r}%`);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={i === 0 ? undefined : { clipPath }}>
      <motion.img loading="lazy" decoding="async"
        {...responsive(scene.src, SCENE_SIZES)}
        alt={`${scene.model} — ${scene.title}`}
        style={{ scale, y, objectPosition: scene.focus }}
        className="h-full w-full object-cover"
        draggable={false}
      />
      {/* Gold edge riding the top of the wipe */}
      {i > 0 && <motion.div className="bg-gold absolute inset-x-0 h-px opacity-80" style={{ top: edgeTop }} />}
    </motion.div>
  );
}
