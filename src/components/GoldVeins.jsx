// Dark smoky marble with kintsugi-style gold veins, drawn into a corner of a section.
// The marble fades out toward the centre; the veins draw themselves in, then glimmer.
import { useId, useRef } from "react";
import { motion, useInView } from "framer-motion";

// Vein paths in a 600×600 box whose corner is at the top-right (600, 0).
const MAIN = "M330 0 C352 48 338 98 384 150 S428 246 468 298 S516 376 538 438 S578 500 600 534";
const BRANCHES = [
  "M384 150 C414 144 446 168 478 150 S540 118 600 128",
  "M436 230 C470 222 500 242 532 230 S578 200 600 206",
  "M468 298 C440 326 418 356 380 380 S330 410 300 448",
  "M250 0 C268 38 296 52 306 92 S326 132 352 140",
  "M520 400 C548 396 572 410 600 404",
  "M538 438 C520 470 524 506 506 540",
];
const HAIRLINES = [
  "M300 448 C276 470 262 500 236 520",
  "M352 140 C340 170 352 196 344 226",
  "M600 300 C586 318 590 342 572 360",
  "M180 0 C196 20 200 44 222 58",
];
const FLECKS = [
  [302, 20, 4.5],
  [318, 46, 2.6],
  [286, 64, 2],
  [344, 30, 1.6],
  [266, 26, 1.4],
  [400, 112, 2.2],
  [560, 470, 2],
  [452, 200, 1.4],
];

// The artwork is drawn for the top-right corner; other corners mirror it.
const CORNERS = {
  "top-right": { transform: undefined, aspect: "xMaxYMin meet", place: "right-0 top-0" },
  "top-left": { transform: "translate(600 0) scale(-1 1)", aspect: "xMinYMin meet", place: "left-0 top-0" },
  "bottom-right": { transform: "translate(0 600) scale(1 -1)", aspect: "xMaxYMax meet", place: "bottom-0 right-0" },
  "bottom-left": { transform: "rotate(180 300 300)", aspect: "xMinYMax meet", place: "bottom-0 left-0" },
};

/**
 * One gold-veined marble corner. Draws in when `ready` is true, or, if `ready`
 * is left undefined, the first time it scrolls into view.
 */
export default function GoldVeins({ corner = "top-right", ready, seed = 7, className = "" }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: "-10% 0px" });
  const active = ready ?? seen;
  const c = CORNERS[corner];
  const draw = (delay, duration) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: active ? { pathLength: 1, opacity: 1 } : {},
    transition: { pathLength: { duration, ease: [0.65, 0, 0.35, 1], delay }, opacity: { duration: 0.4, delay } },
  });

  return (
    <svg ref={ref} viewBox="0 0 600 600" preserveAspectRatio={c.aspect} className={`pointer-events-none absolute ${c.place} ${className}`} aria-hidden="true">
      <defs>
        {/* Smoky marble: fractal noise mapped to cool grey, with alpha from the noise itself */}
        <filter id={`marble-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.009" numOctaves="4" seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.17  0 0 0 0 0.21  0 0 0 0 0.29  1.5 0 0 0 -0.5" />
        </filter>
        <radialGradient id={`fade-${id}`} cx="600" cy="0" r="620" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`mask-${id}`}>
          <rect width="600" height="600" fill={`url(#fade-${id})`} />
        </mask>
        {/* Gold leaf: warm metallic gradient */}
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3b4" />
          <stop offset="0.35" stopColor="#d4ac62" />
          <stop offset="0.7" stopColor="#9a7136" />
          <stop offset="1" stopColor="#e9c98a" />
        </linearGradient>
        {/* Roughens the strokes into cracked, uneven veins */}
        <filter id={`rough-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={seed + 3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <g transform={c.transform}>
        {/* Marble wash */}
        <motion.g mask={`url(#mask-${id})`} initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} transition={{ duration: 2 }}>
          <rect width="600" height="600" filter={`url(#marble-${id})`} />
          <rect width="600" height="600" filter={`url(#marble-${id})`} opacity="0.6" transform="translate(600 0) scale(-1 1)" />
        </motion.g>

        {/* Soft glow beneath the main vein. It fades in once and then holds still: a looping glow
            would make the browser re-run this SVG's marble and roughness filters on every frame. */}
        <motion.path
          d={MAIN}
          fill="none"
          stroke="#d4ac62"
          strokeWidth="14"
          filter={`url(#glow-${id})`}
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 0.3 } : {}}
          transition={{ duration: 2, ease: "easeOut", delay: 2.4 }}
        />

        <g filter={`url(#rough-${id})`} fill="none" strokeLinecap="round">
          <motion.path d={MAIN} stroke={`url(#gold-${id})`} strokeWidth="8.5" {...draw(0.3, 2.4)} />
          <motion.path d={MAIN} stroke="#fff3cf" strokeWidth="2" strokeOpacity="0.8" {...draw(0.5, 2.4)} />
          {BRANCHES.map((d, i) => (
            <motion.path key={d} d={d} stroke={`url(#gold-${id})`} strokeWidth={i < 3 ? 2.6 : 1.8} {...draw(1 + i * 0.18, 1.6)} />
          ))}
          {HAIRLINES.map((d, i) => (
            <motion.path key={d} d={d} stroke="#c9a464" strokeWidth="0.9" strokeOpacity="0.8" {...draw(1.6 + i * 0.15, 1.4)} />
          ))}
        </g>

        {FLECKS.map(([cx, cy, r], i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={`url(#gold-${id})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={active ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 1.8 + i * 0.08, duration: 0.6 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </g>
    </svg>
  );
}

const SIZE = "h-auto w-[66vw] max-w-[560px] sm:w-[42vw] lg:w-[32vw]";

/**
 * Gold-veined corners for a section, placed behind its content.
 * The section needs `relative isolate` so the -z-10 layer stays inside it.
 */
export function EdgeVeins({ corners = ["top-right", "bottom-left"], seed = 7, className = "", size = SIZE }) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden="true">
      {corners.map((corner, i) => (
        <GoldVeins key={corner} corner={corner} seed={seed + i * 11} className={size} />
      ))}
    </div>
  );
}
