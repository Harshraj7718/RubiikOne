// "Two I's. One distinctive vision." — layered parallax imagery with the three pillars.
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SplitReveal, FadeUp, ParallaxImage } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";
import { responsive } from "../lib/img.js";

const PILLARS = [
  ["Precision", "Every detail matters, from the movement to the smallest bevel on the case."],
  ["Perspective", "Time is universal, but every person experiences it differently."],
  ["Complexity made beautiful", "Sophisticated engineering expressed through a clean, purposeful design."],
];

export default function Vision() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const floatY = useTransform(scrollYProgress, [0, 1], [180, -220]);
  const barsScale = useTransform(scrollYProgress, [0.15, 0.5], [0, 1]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden py-28 sm:py-44">
      <div className="mx-auto grid max-w-[1600px] gap-16 px-5 sm:px-10 lg:grid-cols-2">
        <div className="relative h-[70vh] min-h-[520px]">
          <ParallaxImage
            src="/images/skeleton-cuff.webp"
            alt="RUBIIK ONE Automatic worn with a navy suit"
            className="absolute left-0 top-0 h-[78%] w-[78%] rounded-sm"
            strength={80}
          />
          <motion.div style={{ y: floatY }} className="absolute bottom-0 right-0 h-[52%] w-[48%] overflow-hidden rounded-sm shadow-2xl shadow-black/60" data-cursor="View">
            <img loading="lazy" decoding="async" {...responsive("/images/olive-wrist-dark.webp", "(max-width: 1024px) 62vw, 36vw")} alt="RUBIIK ONE Quartz on the wrist" className="h-full w-full scale-110 object-cover transition-transform duration-[1.6s] ease-lux hover:scale-125" />
          </motion.div>
          <motion.div style={{ scaleY: barsScale }} className="absolute -right-2 top-6 flex origin-top gap-3 lg:-right-8">
            <span className="bg-gold h-40 w-[3px]" />
            <span className="bg-gold h-40 w-[3px]" />
          </motion.div>
        </div>

        <div className="flex flex-col justify-center">
          <Chapter n="III" title="The vision" className="mb-6" />
          <h2 className="font-serif text-5xl leading-[1.02] sm:text-7xl">
            <SplitReveal text="Two I's." by="word" />
            <br />
            <SplitReveal text="One distinctive vision." by="word" className="italic text-gold" delay={0.2} />
          </h2>
          <FadeUp delay={0.2} className="mt-8 max-w-xl text-lg leading-relaxed text-ivory-dim">
            RUBIIK represents the meeting of innovation and individuality, expressed through precision engineering and bold geometric design. Created for
            those who see time differently, every watch makes a statement through form, detail and character.
          </FadeUp>

          <div className="mt-14 divide-y divide-ivory/10 border-y border-ivory/10">
            {PILLARS.map(([title, text], i) => (
              <FadeUp key={title} delay={0.1 * i} y={20}>
                <div className="group flex items-start gap-6 py-6">
                  <span className="eyebrow pt-2 text-gold">0{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-serif text-2xl transition-transform duration-700 ease-lux group-hover:translate-x-3 sm:text-3xl">{title}</p>
                    <p className="mt-2 max-h-0 overflow-hidden text-ivory-dim opacity-0 transition-all duration-700 ease-lux group-hover:max-h-24 group-hover:opacity-100 max-md:max-h-24 max-md:opacity-100">
                      {text}
                    </p>
                  </div>
                  <span className="pt-2 text-gold opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:-translate-x-4">→</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
