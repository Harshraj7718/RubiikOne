// Closing statement: "Your time. Your perspective." over the brand film-still.
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Seal } from "../components/Ornament.jsx";
import { SplitReveal, Magnetic } from "../components/motion.jsx";
import { scrollToId } from "../App.jsx";

export default function Finale() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const clip = useTransform(scrollYProgress, [0, 0.8], ["inset(18% 22% 18% 22% round 8px)", "inset(0% 0% 0% 0% round 0px)"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.3, 1]);

  return (
    <section ref={ref} className="relative h-[180vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ clipPath: clip }} className="absolute inset-0">
          <motion.img loading="lazy" decoding="async" src="/images/olive-gentleman.webp" alt="" aria-hidden="true" style={{ scale }} className="h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-night/65" />
        </motion.div>
        <div className="relative flex flex-col items-center px-5 text-center">
          <Seal className="mb-8 h-28 w-28 sm:h-36 sm:w-36" />
          <p className="eyebrow mb-6">RUBIIK ONE</p>
          <h2 className="font-serif text-6xl leading-none sm:text-[9vw]">
            <SplitReveal text="Your time." by="word" />
            <br />
            <SplitReveal text="Your perspective." by="word" className="italic text-gold" delay={0.2} />
          </h2>
          <Magnetic className="mt-12">
            <button onClick={() => scrollToId("collection")} className="btn-gold" data-cursor="Discover">
              Discover RUBIIK ONE
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
