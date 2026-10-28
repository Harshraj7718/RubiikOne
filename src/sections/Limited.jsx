// Limited edition: the "200" counts up; each model has its own numbered edition of 200 (400 in all),
// each shown as available ("Very limited pieces left") or sold out; exact counts are not public.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, useScroll, useTransform } from "framer-motion";
import { PRODUCTS, LAUNCH, EDITION_TOTAL } from "../data/catalog.js";
import { useShop } from "../lib/shop.jsx";
import { FadeUp, ease } from "../components/motion.jsx";
import { Chapter, Divider } from "../components/Ornament.jsx";

export default function Limited() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [n, setN] = useState(0);
  const { stock } = useShop().status;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  useEffect(() => {
    if (!inView) return;
    const c = animate(0, LAUNCH.editionPerModel, { duration: 2.4, ease, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView]);

  return (
    <section id="limited" ref={ref} className="relative overflow-hidden py-32 sm:py-48">
      <motion.img loading="lazy" decoding="async"
        src="/images/duo-flatlay.webp"
        alt=""
        aria-hidden="true"
        style={{ y: bgY }}
        className="absolute inset-0 h-[130%] w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night via-night/70 to-night" />

      <div className="relative mx-auto max-w-[1600px] px-5 text-center sm:px-10">
        <Chapter n="VIII" title="Limited edition" center />
        <p className="mt-6 font-serif text-[38vw] leading-[0.8] tabular-nums sm:text-[26vw]">
          <span className="text-gold">{n}</span>
        </p>
        <p className="mt-2 font-serif text-3xl italic sm:text-5xl">numbered pieces of each. Never more.</p>
        <Divider className="mt-8" width="w-20 sm:w-40" />
        <FadeUp className="mx-auto mt-8 max-w-xl text-ivory-dim">
          {LAUNCH.editionPerModel} Automatic Skeletons and {LAUNCH.editionPerModel} Quartz Olives, {EDITION_TOTAL} pieces in all. Each is individually numbered within its
          model and arrives with its own certificate of edition. Once a model's {LAUNCH.editionPerModel} are gone, it is retired.
        </FadeUp>

        {/* Two editions, one per model. Availability only; exact counts stay private. */}
        <FadeUp className="frame-royal mx-auto mt-16 max-w-3xl space-y-7 bg-night/60 p-6 text-left backdrop-blur sm:p-8">
          {PRODUCTS.map((p) => {
            const available = stock.byModel?.[p.slug]?.available !== false;
            return (
              <div key={p.slug}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-center gap-3 font-serif text-2xl">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
                    {p.edition}
                  </span>
                  <span className={`eyebrow flex items-center gap-2 whitespace-nowrap ${available ? "text-gold" : "text-ivory-mute"}`}>
                    {available && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />}
                    {available ? "Very limited pieces left" : "Sold out"}
                  </span>
                </div>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                <p className="mt-2 text-xs uppercase tracking-wide2 text-ivory-mute">Numbered No. 001–{String(LAUNCH.editionPerModel).padStart(3, "0")}</p>
              </div>
            );
          })}
        </FadeUp>
      </div>
    </section>
  );
}
