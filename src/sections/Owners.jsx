// The Founding Owners: certificate cards of everyone who completed a pre-order and chose to
// appear, shown right after the hero. Only the display name each owner picked is public.
// Nothing is shown until there is at least one real certificate.
import { useEffect, useState } from "react";
import { useShop } from "../lib/shop.jsx";
import Certificate from "../components/Certificate.jsx";
import { Divider } from "../components/Ornament.jsx";
import { FadeUp, Magnetic } from "../components/motion.jsx";
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
  }, [status.stock]);

  const list = owners ?? [];
  // Only real certificates from completed pre-bookings are shown; until the first one exists
  // (or while loading) the section stays hidden.
  if (!list.length) return null;
  // The rail loops by sliding one half of the track (marquee keyframes move it -50%). Each half
  // repeats the cards until it is wider than the widest screens (cards are ≤ 380px + 24px gap),
  // so even one or two owners fill the rail without a gap.
  const half = Array.from({ length: Math.max(1, Math.ceil(2800 / (list.length * 344))) }, () => list).flat();
  const seconds = half.length * 6; // about one card every 6 seconds, at any count

  return (
    <section id="owners" className="relative overflow-hidden border-b border-gold/10 bg-night-900 py-20 sm:py-28">
      <div className="mx-auto max-w-[1600px] px-5 text-center sm:px-10">
        <p className="eyebrow text-gold">The Founding Owners</p>
        <h2 className="mt-4 font-serif text-4xl sm:text-6xl">
          Every piece has a <span className="italic text-gold">name.</span>
        </h2>
        <Divider className="mt-6" width="w-16 sm:w-32" />
        <FadeUp className="mx-auto mt-5 max-w-xl text-ivory-dim">
          Each RUBIIK ONE carries its owner's name and its own serial. Very limited pieces of each model remain.
        </FadeUp>
      </div>

      <div className="mt-12 sm:mt-16">
        {/* Pauses on hover; with reduced motion it stops and can be scrolled by hand instead. */}
        <div className="group/rail relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto">
          <div
            className="flex shrink-0 gap-6 pr-6 group-hover/rail:[animation-play-state:paused] motion-reduce:![animation:none]"
            style={{ animation: `marquee ${seconds}s linear infinite` }}
          >
            {[...half, ...half].map((o, i) => (
              // Repeated cards are decorative copies, hidden from screen readers.
              <div key={`${o.serial}-${i}`} aria-hidden={i >= list.length || undefined}>
                <Certificate cert={o} name={o.displayName} size="sm" />
              </div>
            ))}
          </div>
        </div>
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
