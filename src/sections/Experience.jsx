// THE RUBIIK EXPERIENCE — the two casebacks turn as the section scrolls past.
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SplitReveal, FadeUp } from "../components/motion.jsx";
import { Chapter } from "../components/Ornament.jsx";
import { EdgeVeins } from "../components/GoldVeins.jsx";

export default function Experience() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const spinA = useTransform(scrollYProgress, [0, 1], [-60, 60]);
  const spinB = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const yA = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const yB = useTransform(scrollYProgress, [0, 1], [-60, 160]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden py-28 sm:py-44">
      <EdgeVeins corners={["top-left","bottom-right"]} seed={31} />
      <div className="mx-auto grid max-w-[1600px] items-center gap-20 px-5 sm:px-10 lg:grid-cols-2">
        <div>
          <Chapter n="VII" title="The RUBIIK experience" className="mb-6" />
          <h2 className="font-serif text-5xl leading-[1.04] sm:text-7xl">
            <SplitReveal text="More than an accessory." by="word" />
          </h2>
          <FadeUp delay={0.15} className="mt-8 max-w-lg text-lg leading-relaxed text-ivory-dim">
            RUBIIK ONE is an expression of personal style. From its presentation to the details you notice over time, every element reflects our belief that
            true distinction lies in precision.
          </FadeUp>
          <FadeUp delay={0.3} className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-ivory/10 pt-8">
            {[
              ["5", "ATM"],
              ["100%", "Stainless steel"],
              ["200", "Pieces"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-serif text-4xl text-gold">{n}</p>
                <p className="eyebrow mt-1">{l}</p>
              </div>
            ))}
          </FadeUp>
        </div>

        <div className="relative h-[560px]">
          <motion.img loading="lazy" decoding="async"
            src="/images/skeleton-caseback.webp"
            alt="RUBIIK ONE Automatic exhibition caseback"
            style={{ rotate: spinA, y: yA }}
            className="absolute left-0 top-0 w-[62%] drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]"
          />
          <motion.img loading="lazy" decoding="async"
            src="/images/olive-caseback.webp"
            alt="RUBIIK ONE Quartz engraved caseback"
            style={{ rotate: spinB, y: yB }}
            className="absolute bottom-0 right-0 w-[56%] drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>
    </section>
  );
}
