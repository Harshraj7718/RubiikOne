// Dhanteras ornaments for the launch date, drawn in the house palette (gold, wine, ivory):
// a marigold toran, a slowly turning rangoli, flickering diyas, drifting gold coins and a silk banner.
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

const GOLD = "#C9A464";
const GOLD_LIGHT = "#ECD29C";
const MARIGOLD = "#E8A23A";
const MARIGOLD_DEEP = "#C9711E";
const LEAF = "#5E6B2E";

/** A marigold-and-mango-leaf garland hanging in a shallow swag across the top of the block. */
export function Toran({ className = "" }) {
  const flowers = 17;
  // Points along a gentle downward curve.
  const at = (i) => {
    const t = i / (flowers - 1);
    return { x: 20 + t * 960, y: 18 + Math.sin(t * Math.PI) * 34 };
  };
  return (
    <svg viewBox="0 0 1000 120" className={className} aria-hidden="true">
      <path d="M20 18 Q500 104 980 18" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1.2" />
      {Array.from({ length: flowers }, (_, i) => {
        const { x, y } = at(i);
        const leaf = i % 2 === 1;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            {leaf ? (
              // Mango leaf hanging between the flowers
              <path d="M0 4 C9 18 7 34 0 46 C-7 34 -9 18 0 4 Z" fill={LEAF} opacity="0.9" />
            ) : (
              <>
                {[0, 1, 2].map((k) => (
                  <circle key={k} cy={8 + k * 13} r={7 - k} fill={k % 2 ? MARIGOLD_DEEP : MARIGOLD} />
                ))}
                <circle cy="8" r="2.2" fill={GOLD_LIGHT} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A fine-line rangoli: rings of petals and dots, turning very slowly behind the date. */
export function Rangoli({ className = "" }) {
  const reduce = useReducedMotion();
  const petals = (count, r, len, w) =>
    Array.from({ length: count }, (_, i) => (
      <ellipse key={i} cx="0" cy={-r} rx={w} ry={len} transform={`rotate(${(360 / count) * i})`} />
    ));
  const dots = (count, r, size) =>
    Array.from({ length: count }, (_, i) => {
      const a = ((Math.PI * 2) / count) * i;
      return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={size} />;
    });
  return (
    <motion.svg
      viewBox="-200 -200 400 400"
      className={className}
      aria-hidden="true"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 160, repeat: Infinity, ease: "linear" }}
    >
      <g fill="none" stroke={GOLD} strokeWidth="0.8">
        <circle r="190" strokeOpacity="0.35" />
        <circle r="150" strokeOpacity="0.45" />
        <circle r="62" strokeOpacity="0.5" />
        <g strokeOpacity="0.55">{petals(24, 170, 18, 7)}</g>
        <g strokeOpacity="0.6">{petals(16, 112, 34, 13)}</g>
        <g strokeOpacity="0.5">{petals(8, 70, 22, 10)}</g>
      </g>
      <g fill={GOLD_LIGHT} fillOpacity="0.55">
        {dots(48, 182, 1.6)}
        {dots(16, 150, 2.4)}
        {dots(8, 40, 2.2)}
      </g>
    </motion.svg>
  );
}

/** A clay diya with a softly flickering flame. */
export function Diya({ className = "", delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="diya-glow">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.7" />
          <stop offset="100%" stopColor={MARIGOLD} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="diya-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={MARIGOLD_DEEP} />
          <stop offset="55%" stopColor={MARIGOLD} />
          <stop offset="100%" stopColor="#FFF4D6" />
        </linearGradient>
        <linearGradient id="diya-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="40"
        cy="30"
        r="24"
        fill="url(#diya-glow)"
        animate={reduce ? undefined : { opacity: [0.55, 0.9, 0.6, 0.85, 0.55] }}
        transition={{ duration: 2.4, repeat: Infinity, delay }}
      />
      <motion.path
        d="M40 12 C46 22 47 30 40 38 C33 30 34 22 40 12 Z"
        fill="url(#diya-flame)"
        style={{ originX: "40px", originY: "38px" }}
        animate={reduce ? undefined : { scaleY: [1, 1.12, 0.94, 1.08, 1], rotate: [0, -3, 2, -1, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, delay }}
      />
      {/* Bowl with a pinched spout */}
      <path d="M10 44 Q40 40 66 44 L74 40 Q70 48 64 50 Q56 66 40 66 Q24 66 16 52 Q10 49 10 44 Z" fill="url(#diya-clay)" />
      <path d="M18 52 Q40 58 62 52" fill="none" stroke="#7a0002" strokeOpacity="0.55" strokeWidth="1.4" />
      {[26, 40, 54].map((x) => (
        <circle key={x} cx={x} cy="58" r="1.5" fill="#7a0002" fillOpacity="0.6" />
      ))}
    </svg>
  );
}

/** Gold coins drifting slowly downwards — the traditional Dhanteras purchase. */
export function GoldCoins({ count = 9, className = "" }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Fixed, evenly spread positions so the layout is stable between renders.
        const left = 6 + ((i * 37) % 88);
        const size = 10 + ((i * 5) % 9);
        return (
          <motion.span
            key={i}
            className="absolute block rounded-full"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 60%, #8a6a2e)`,
              boxShadow: "0 0 10px rgba(236,210,156,0.45)",
            }}
            // top is a percentage of the block, so coins fall its full height whatever its size.
            initial={{ top: "-5%", opacity: 0 }}
            animate={{ top: ["-5%", "105%"], opacity: [0, 0.85, 0.85, 0], rotateY: [0, 360, 720] }}
            transition={{ duration: 9 + (i % 4) * 2, repeat: Infinity, delay: i * 1.3, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

// ---------- Silk banner ----------
// The cloth is drawn in a 400×100 box stretched over the card. Its top and bottom edges are sine
// waves; advancing the phase makes the ripples travel along the cloth like silk lifted by the air.
const SILK_POINTS = 24;
function silkPath(phase) {
  const edge = (y0, amp, offset) =>
    Array.from({ length: SILK_POINTS + 1 }, (_, i) => {
      const t = i / SILK_POINTS;
      // The free (right) end flutters more than the end nearest the viewer's reading start.
      const a = amp * (0.6 + 0.8 * t);
      return [t * 400, y0 + a * Math.sin(t * Math.PI * 3 + phase + offset)];
    });
  const top = edge(7, 5, 0);
  const bottom = edge(93, 5, 0.9).reverse();
  // The two short ends sway sideways a little.
  top[0][0] = bottom[bottom.length - 1][0] = 4 + 3 * Math.sin(phase);
  top[top.length - 1][0] = bottom[0][0] = 396 + 4 * Math.sin(phase + 1.3);
  const pts = [...top, ...bottom].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`);
  return `M${pts.join(" L")} Z`;
}
// One full cycle of the ripple, as keyframes (the last equals the first, so the loop is seamless).
const SILK_FRAMES = [0, 1, 2, 3, 4, 5, 6].map((k) => silkPath((k / 6) * Math.PI * 2));

/** A card made of red silk, rippling and drifting gently in the air. Children sit on the cloth. */
export function SilkBanner({ children, className = "" }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const ripple = reduce ? {} : { animate: { d: SILK_FRAMES }, transition: { duration: 4.5, repeat: Infinity, ease: "linear" } };
  return (
    <motion.div
      className="relative"
      animate={reduce ? undefined : { y: [0, -4, 0, 3, 0], rotate: [-0.6, 0.5, -0.3, 0.6, -0.6] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] drop-shadow-[0_14px_22px_rgba(0,0,0,0.55)]"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={`${id}-cloth`}>
            <motion.path d={SILK_FRAMES[0]} {...ripple} />
          </clipPath>
          {/* Folds: dark troughs and bright crests, repeated across the cloth */}
          <linearGradient id={`${id}-folds`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="70" y2="12" spreadMethod="reflect">
            <stop offset="0%" stopColor="#5E0002" />
            <stop offset="45%" stopColor="#A50003" />
            <stop offset="75%" stopColor="#D2282C" />
            <stop offset="100%" stopColor="#8A0003" />
          </linearGradient>
          {/* Light falls on the upper edge; the lower edge sinks into shadow */}
          <linearGradient id={`${id}-light`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE3C4" stopOpacity="0.28" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}-cloth)`}>
          {/* The folds slide along the cloth by one fold period per cycle, so the loop is seamless. */}
          <motion.rect
            x="-280"
            y="-10"
            width="960"
            height="120"
            fill={`url(#${id}-folds)`}
            // The fold pattern repeats every 144.1 units horizontally (2·|v|²/vx for the 70×12 gradient vector).
            animate={reduce ? undefined : { x: [-280, -280 + 144.1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
          <rect x="0" y="0" width="400" height="100" fill={`url(#${id}-light)`} />
        </g>
        {/* A fine gold hem following the cloth's edge */}
        <motion.path
          d={SILK_FRAMES[0]}
          {...ripple}
          fill="none"
          stroke={GOLD_LIGHT}
          strokeOpacity="0.75"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* className lays out the content sitting on the cloth */}
      <div className={`relative ${className}`}>{children}</div>
    </motion.div>
  );
}
