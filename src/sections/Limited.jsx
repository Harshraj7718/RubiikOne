// Limited edition: the "200" counts up, with live remaining stock for the shared edition.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, useScroll, useTransform } from "framer-motion";
import { PRODUCTS } from "../data/catalog.js";
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
    const c = animate(0, 200, { duration: 2.4, ease, onUpdate: (v) => setN(Math.round(v)) });
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
        <p className="mt-2 font-serif text-3xl italic sm:text-5xl">numbered pieces. Never more.</p>
        <Divider className="mt-8" width="w-20 sm:w-40" />
        <FadeUp className="mx-auto mt-8 max-w-xl text-ivory-dim">
          200 pieces in total, shared across the Automatic and the Quartz. Each is individually numbered and arrives with its own certificate of edition.
          Once the 200 are gone, the design is retired.
        </FadeUp>

        {/* One shared edition: a single bar, split by which model each piece went to */}
        <FadeUp className="frame-royal mx-auto mt-16 max-w-3xl bg-night/60 p-6 text-left backdrop-blur sm:p-8">
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl">The edition</span>
            <span className="eyebrow tabular-nums text-gold">
              {stock.remaining}/{stock.total} left
            </span>
          </div>
          <div className="mt-5 flex h-[3px] w-full overflow-hidden bg-ivory/10">
            {PRODUCTS.map((p) => (
              <motion.div
                key={p.slug}
                className="h-full"
                style={{ background: p.accent }}
                initial={{ width: 0 }}
                whileInView={{ width: `${((stock.byModel?.[p.slug] ?? 0) / stock.total) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease }}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs uppercase tracking-wide2 text-ivory-mute">
            {PRODUCTS.map((p) => (
              <span key={p.slug} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: p.accent }} />
                {p.edition} · {stock.byModel?.[p.slug] ?? 0} reserved
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
