// Kinetic typography: staggered lines slide in opposite directions while pinned.
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ScrubWords } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";
import { EdgeVeins } from "../components/GoldVeins.jsx";

const LINES = [
  { text: "Precision", from: "-30%", to: "8%", className: "text-ivory/25" },
  { text: "in every", from: "40%", to: "-12%", className: "italic text-gold" },
  { text: "dimension.", from: "-20%", to: "14%", className: "text-ivory" },
];

export default function Manifesto() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section id="philosophy" className="relative isolate overflow-hidden py-32 sm:py-48">
      <EdgeVeins corners={["top-left","bottom-right"]} seed={11} />
      <div ref={ref} className="flex flex-col gap-2 font-serif text-[17vw] uppercase leading-[0.85] tracking-tight sm:text-[13vw]">
        {LINES.map((l, i) => (
          <Line key={i} progress={scrollYProgress} {...l} align={i % 2 ? "self-end pr-[4vw]" : "self-start pl-[4vw]"} />
        ))}
      </div>

      <div className="mx-auto mt-24 grid max-w-[1400px] gap-16 px-5 sm:mt-40 sm:px-10 md:grid-cols-[1fr_2fr]">
        <div>
          <Chapter n="I" title="The philosophy" />
        </div>
        <ScrubWords
          className="font-serif text-3xl leading-snug sm:text-5xl"
          text="A philosophy inspired by the relationship between time, precision and design. Time is universal, but every person experiences it differently."
          highlight={["precision", "differently"]}
        />
      </div>
    </section>
  );
}

function Line({ progress, text, from, to, className, align }) {
  const x = useTransform(progress, [0, 1], [from, to]);
  return (
    <motion.span style={{ x }} className={`block whitespace-nowrap ${align} ${className}`}>
      {text}
    </motion.span>
  );
}
