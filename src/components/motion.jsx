// Reusable motion primitives: split-text reveals, scroll-scrubbed words, parallax images, magnetic hover.
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { responsive } from "../lib/img.js";

export const ease = [0.22, 1, 0.36, 1];

/** Letters (or words) rise out of a mask when scrolled into view. */
export function SplitReveal({ text, as: Tag = "span", by = "char", className = "", delay = 0, stagger = 0.035, once = true }) {
  const words = text.split(" ");
  const MotionTag = motion[Tag] ?? motion.span;
  const piece = (content, key) => (
    <span key={key} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
      <motion.span className="inline-block" variants={{ hidden: { y: "110%", rotate: 4 }, show: { y: "0%", rotate: 0, transition: { duration: 1.1, ease } } }}>
        {content}
      </motion.span>
    </span>
  );
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-10% 0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => {
        const gap = i < words.length - 1 ? " " : "";
        if (by === "word") return piece(w + gap, i);
        // Characters animate individually but each word stays unbroken when lines wrap.
        return (
          <span key={i} className="inline-block whitespace-nowrap">
            {[...(w + gap)].map((c, j) => piece(c, j))}
          </span>
        );
      })}
    </MotionTag>
  );
}

/** Fades and lifts children into view. */
export function FadeUp({ children, delay = 0, y = 40, className = "", as = "div" }) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 1.2, ease, delay }}
    >
      {children}
    </M>
  );
}

/** Each word brightens as the paragraph is scrolled through. */
export function ScrubWords({ text, className = "", highlight = [] }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} gold={highlight.includes(w.replace(/[.,]/g, ""))}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range, gold }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className={`inline-block mr-[0.28em] ${gold ? "text-gold italic" : ""}`}>
      {children}
    </motion.span>
  );
}

/**
 * Image that drifts slower than the page and zooms slightly while in view.
 * `sizes` is how wide the image is drawn (including the zoom), so the browser picks a file that
 * stays sharp; it errs on the large side.
 */
export function ParallaxImage({ src, alt, className = "", strength = 120, scale = 1.25, imgClassName = "", sizes = "(max-width: 1024px) 125vw, 75vw" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.img loading="lazy" decoding="async"
        {...responsive(src, sizes)}
        alt={alt}
        style={{ y, scale }}
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}

/** Pulls its child toward the pointer while hovered. */
export function Magnetic({ children, strength = 0.35, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div ref={ref} onMouseMove={move} onMouseLeave={leave} style={{ x: sx, y: sy }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  );
}

/** 3D tilt that follows the pointer, used on product cards. */
export function Tilt({ children, className = "", max = 10 }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 18 });
  const sry = useSpring(ry, { stiffness: 150, damping: 18 });
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Marquee({ items, className = "", speed = 40 }) {
  const row = [...items, ...items];
  return (
    <div className={`relative flex overflow-hidden ${className}`}>
      <div className="flex shrink-0 items-center gap-12 pr-12" style={{ animation: `marquee ${speed}s linear infinite` }}>
        {row.concat(row).map((t, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap">
            {t}
            <span className="h-2 w-2 rotate-45 bg-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
