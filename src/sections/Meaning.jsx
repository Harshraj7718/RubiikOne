// II — The meaning of RUBIIK. A pinned monogram: six outlined letters light up in gold one at a
// time as you scroll, each revealing its word. The sequence ends on the two I's together.
import { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import { ease } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";
import { scrollToY } from "../App.jsx";

const LETTERS = [
  { l: "R", word: "Refinement", desc: "Exceptional attention to detail." },
  { l: "U", word: "Uniqueness", desc: "A distinctive identity." },
  { l: "B", word: "Balance", desc: "Harmony between design and engineering." },
  { l: "I", word: "Innovation", desc: "Challenging conventional watch design." },
  { l: "I", word: "Individuality", desc: "Expressing your own perspective." },
  { l: "K", word: "Kinetics", desc: "The movement and precision of time." },
];
const FINALE = LETTERS.length; // the closing step: both I's together
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

export default function Meaning() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(FINALE, Math.floor(v * (FINALE + 1)))));
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const lit = (i) => (step === FINALE ? i === 3 || i === 4 : i === step);
  const jump = (i) => {
    const el = ref.current;
    const span = el.offsetHeight - window.innerHeight;
    scrollToY(el.getBoundingClientRect().top + window.scrollY + span * ((i + 0.5) / (FINALE + 1)));
  };

  return (
    <section id="meaning" ref={ref} className="relative bg-night-800" style={{ height: `${(FINALE + 1) * 70 + 30}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="damask pointer-events-none absolute inset-0 opacity-[0.05]" />
        {/* Soft gold light that follows the lit letter */}
        <motion.div
          className="pointer-events-none absolute top-[45%] h-[50vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
          animate={{ left: step === FINALE ? "50%" : `${(step + 0.5) * (100 / 6)}%` }}
          transition={{ duration: 1, ease }}
        />

        <div className="relative mx-auto w-full max-w-[1600px] px-5 pt-24 sm:px-10 sm:pt-28">
          <Chapter n="II" title="The meaning of RUBIIK" />
          <h2 className="mt-4 font-serif text-3xl sm:text-5xl">
            Six letters. <span className="italic text-gold">One way of seeing.</span>
          </h2>
        </div>

        {/* The monogram */}
        <div className="relative flex flex-1 items-center justify-center px-2">
          <div className="flex w-full max-w-[1500px] justify-between">
            {LETTERS.map((it, i) => (
              <button key={i} onClick={() => jump(i)} className="relative flex flex-1 flex-col items-center" aria-label={`${it.l} — ${it.word}`}>
                <motion.span
                  className={`font-serif text-[22vw] leading-none sm:text-[15vw] ${lit(i) ? "text-gold" : "text-transparent"}`}
                  style={{ WebkitTextStroke: lit(i) ? "0px transparent" : "1px rgba(201,164,100,0.45)" }}
                  animate={{ y: lit(i) ? -12 : 0, scale: lit(i) ? 1.06 : 1, opacity: lit(i) || step === FINALE ? 1 : 0.75 }}
                  transition={{ duration: 0.9, ease }}
                >
                  {it.l}
                </motion.span>
                <motion.span
                  className="bg-gold mt-2 h-2 w-2 rotate-45"
                  animate={{ opacity: lit(i) ? 1 : 0, scale: lit(i) ? 1 : 0.2 }}
                  transition={{ duration: 0.6, ease }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* The word for the lit letter */}
        <div className="relative mx-auto mb-14 w-full max-w-[1600px] px-5 sm:mb-20 sm:px-10">
          <div className="flex items-end justify-between gap-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial="hidden" animate="show" exit="exit" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
                <motion.p variants={fade} className="eyebrow mb-3 text-gold">
                  {step === FINALE ? "The heart of the brand" : `${NUMERALS[step]} of VI · ${LETTERS[step].l}`}
                </motion.p>
                <h3 className="overflow-hidden font-serif text-[2.6rem] italic leading-none sm:text-8xl">
                  <motion.span className="block" variants={rise}>
                    {step === FINALE ? "Innovation + Individuality" : LETTERS[step].word}
                  </motion.span>
                </h3>
                <motion.p variants={fade} className="mt-4 max-w-xl text-ivory-dim sm:text-lg">
                  {step === FINALE ? "Two I's, side by side — the meeting of new ideas and your own perspective." : LETTERS[step].desc}
                </motion.p>
              </motion.div>
            </AnimatePresence>
            <div className="hidden w-40 shrink-0 sm:block">
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-ivory-mute">
                <span>R</span>
                <span>K</span>
              </div>
              <div className="mt-2 h-px bg-ivory/15">
                <motion.div className="bg-gold h-full origin-left" style={{ scaleX: bar }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } }, exit: { opacity: 0, transition: { duration: 0.2 } } };
const rise = { hidden: { y: "105%" }, show: { y: 0, transition: { duration: 0.9, ease } }, exit: { y: "-105%", transition: { duration: 0.35, ease } } };
