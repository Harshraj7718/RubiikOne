// The Founding Owners: certificate cards of everyone who completed a pre-order and chose to
// appear, shown right after the hero. Only the display name each owner picked is public.
// Nothing is shown until there is at least one real certificate.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useShop } from "../lib/shop.jsx";
import { LAUNCH } from "../data/catalog.js";
import Certificate from "../components/Certificate.jsx";
import { Divider } from "../components/Ornament.jsx";
import { FadeUp, Magnetic, ease } from "../components/motion.jsx";
import { scrollToId } from "../App.jsx";

export default function Owners() {
  const [owners, setOwners] = useState(null);
  const { status, phase } = useShop();

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/owners")
        .then((r) => r.json())
        .then((d) => alive && setOwners(d.owners ?? []))
        .catch(() => alive && setOwners([]));
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [status.stock.reserved]);

  const claimed = status.stock.total - status.stock.remaining;
  const list = owners ?? [];
  // Only real certificates from completed pre-bookings are shown; until the first one exists
  // (or while loading) the section stays hidden.
  if (!list.length) return null;
  // Scroll as a moving ribbon once there are enough cards; otherwise sit centred.
  const ribbon = list.length >= 4;

  return (
    <section id="owners" className="relative overflow-hidden border-b border-gold/10 bg-night-900 py-20 sm:py-28">
      <div className="mx-auto max-w-[1600px] px-5 text-center sm:px-10">
        <p className="eyebrow text-gold">The Founding Owners</p>
        <h2 className="mt-4 font-serif text-4xl sm:text-6xl">
          Every piece has a <span className="italic text-gold">name.</span>
        </h2>
        <Divider className="mt-6" width="w-16 sm:w-32" />
        <FadeUp className="mx-auto mt-5 max-w-xl text-ivory-dim">
          Each RUBIIK ONE carries its owner's name and its own serial. {`${claimed} of ${LAUNCH.editionSize} pieces ${claimed === 1 ? "is" : "are"} already spoken for.`}
        </FadeUp>
      </div>

      <div className="mt-12 sm:mt-16">
        {ribbon ? (
          <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex shrink-0 gap-6 pr-6" style={{ animation: `marquee ${Math.max(30, list.length * 7)}s linear infinite` }}>
              {[...list, ...list].map((o, i) => (
                <Certificate key={`${o.serial}-${i}`} cert={o} name={o.displayName} size="sm" />
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 px-5">
            {list.map((o, i) => (
              <motion.div key={o.serial} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease, delay: i * 0.1 }}>
                <Certificate cert={o} name={o.displayName} size="sm" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {phase !== "teaser" && (
        <div className="mt-12 text-center">
          <Magnetic>
            <button onClick={() => scrollToId("prebook")} className="btn-ghost" data-cursor="Reserve">
              Add your name
            </button>
          </Magnetic>
        </div>
      )}
    </section>
  );
}
