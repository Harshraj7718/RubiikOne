// Festive ornaments for the Christmas launch, kept in the house palette (gold, emerald, ivory)
// with a single deep-red accent for berries and ribbon.
import { motion } from "framer-motion";

const BERRY = "#8e1b2c";

/** Gold baubles hanging on threads, swinging gently. */
export function Baubles({ className = "" }) {
  const items = [
    { x: "6%", len: 90, r: 26, delay: 0 },
    { x: "16%", len: 150, r: 18, delay: 0.6, emblem: false },
    { x: "84%", len: 120, r: 22, delay: 0.3 },
    { x: "93%", len: 70, r: 30, delay: 0.9, emblem: true },
  ];
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-64 ${className}`} aria-hidden="true">
      {items.map((b, i) => (
        <motion.div
          key={i}
          className="absolute top-0 origin-top"
          style={{ left: b.x }}
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        >
          <motion.div initial={{ y: -b.len - 80 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: b.delay * 0.4 }}>
            <span className="mx-auto block w-px bg-gradient-to-b from-gold/10 to-gold/70" style={{ height: b.len }} />
            <Bauble r={b.r} emblem={b.emblem ?? i % 2 === 0} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

function Bauble({ r, emblem }) {
  const s = r * 2 + 8;
  return (
    <svg width={s} height={s + 10} viewBox={`0 0 ${s} ${s + 10}`} className="block">
      <defs>
        <radialGradient id={`bauble-${r}`} cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset="0.3" stopColor="#e2c587" />
          <stop offset="0.75" stopColor="#8c6a35" />
          <stop offset="1" stopColor="#4a3818" />
        </radialGradient>
      </defs>
      <rect x={s / 2 - 5} y="0" width="10" height="8" rx="1.5" fill="#c9a464" />
      <circle cx={s / 2} cy={r + 12} r={r} fill={`url(#bauble-${r})`} />
      <ellipse cx={s / 2} cy={r + 12} rx={r} ry={r * 0.22} fill="none" stroke="rgba(255,243,207,0.45)" strokeWidth="0.8" />
      {emblem && <path d={`M${s / 2 - 5} ${r + 2}h2.4l-.4 20h-1.6zM${s / 2 + 2.6} ${r + 2}h2.4l-.4 20h-1.6z`} fill="rgba(5,12,9,0.55)" />}
      <circle cx={s / 2 - r * 0.38} cy={r + 12 - r * 0.4} r={r * 0.18} fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

/** A twinkling four-point star, used above the heading. */
export function Star({ className = "h-12 w-12" }) {
  return (
    <motion.svg viewBox="0 0 100 100" className={className} aria-hidden="true" animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <defs>
        <radialGradient id="star-glow">
          <stop offset="0" stopColor="rgba(241,220,170,0.7)" />
          <stop offset="1" stopColor="rgba(241,220,170,0)" />
        </radialGradient>
        <linearGradient id="star-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset="0.5" stopColor="#c9a464" />
          <stop offset="1" stopColor="#8c6a35" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#star-glow)" />
      <path d="M50 4 L56 44 L96 50 L56 56 L50 96 L44 56 L4 50 L44 44 Z" fill="url(#star-gold)" />
      <path d="M50 26 L53 47 L74 50 L53 53 L50 74 L47 53 L26 50 L47 47 Z" fill="#fff3cf" opacity="0.7" transform="rotate(45 50 50)" />
    </motion.svg>
  );
}

/** A sprig of holly: two gold-edged leaves and three berries. */
export function Holly({ className = "h-10 w-16", flip = false }) {
  return (
    <svg viewBox="0 0 80 50" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <g fill="#173327" stroke="#c9a464" strokeWidth="1">
        <path d="M40 26 C34 20 30 22 26 16 C24 20 18 20 16 16 C14 22 8 22 4 20 C10 26 10 30 6 34 C12 34 16 38 18 42 C22 38 28 40 32 36 C34 32 38 30 40 26 Z" />
        <path d="M40 26 C46 20 50 22 54 16 C56 20 62 20 64 16 C66 22 72 22 76 20 C70 26 70 30 74 34 C68 34 64 38 62 42 C58 38 52 40 48 36 C46 32 42 30 40 26 Z" />
      </g>
      <g fill={BERRY} stroke="rgba(255,220,200,0.35)" strokeWidth="0.6">
        <circle cx="36" cy="26" r="4.5" />
        <circle cx="44" cy="26" r="4.5" />
        <circle cx="40" cy="19" r="4.5" />
      </g>
    </svg>
  );
}

/** Gift-ribbon corner with a bow, for product cards. */
export function GiftRibbon({ label = "Christmas launch" }) {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 h-32 w-32 overflow-hidden" aria-hidden="true">
      <div
        className="absolute right-[-44px] top-[26px] w-[180px] rotate-45 py-1.5 text-center font-sans text-[9px] uppercase tracking-[0.25em] text-ivory shadow-lg"
        style={{ background: `linear-gradient(90deg, #5e1220, ${BERRY} 50%, #5e1220)`, borderTop: "1px solid rgba(236,210,156,0.6)", borderBottom: "1px solid rgba(236,210,156,0.6)" }}
      >
        {label}
      </div>
    </div>
  );
}
