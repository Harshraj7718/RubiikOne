// Regal ornaments: chapter headings with Roman numerals, the logo's diamond divider, and a rotating seal.
import { motion } from "framer-motion";
import { Emblem } from "./Logo.jsx";
import { ease } from "./motion.jsx";

/** "— I — THE PHILOSOPHY" style chapter marker. */
export function Chapter({ n, title, className = "", dark = false, center = false }) {
  return (
    <motion.div
      className={`flex items-center gap-4 ${center ? "justify-center" : ""} ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease }}
    >
      <motion.span
        className={`h-px w-10 origin-left ${dark ? "bg-gold-deep" : "bg-gold"}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease, delay: 0.2 }}
      />
      <span className={`font-serif text-lg italic ${dark ? "text-gold-deep" : "text-gold"}`}>{n}</span>
      <span className={`eyebrow ${dark ? "!text-night/60" : ""}`}>{title}</span>
    </motion.div>
  );
}

/** The divider from the logo: two tapering gold lines around a diamond. */
export function Divider({ className = "", width = "w-56" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <motion.span
        className={`h-px ${width} origin-right bg-gradient-to-r from-transparent to-gold`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease }}
      />
      <span className="bg-gold h-2 w-2 shrink-0 rotate-45" />
      <motion.span
        className={`h-px ${width} origin-left bg-gradient-to-l from-transparent to-gold`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease }}
      />
    </div>
  );
}

/** A slowly turning seal: engraved ring text around the double-I emblem. */
export function Seal({ className = "h-32 w-32", text = "RUBIIK · PRECISION IN EVERY DIMENSION · EST. MMXXVI · " }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" style={{ animation: "spin-slow 40s linear infinite" }}>
        <defs>
          <path id="seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          <linearGradient id="seal-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f1dcaa" />
            <stop offset="0.5" stopColor="#c9a464" />
            <stop offset="1" stopColor="#8c6a35" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke="url(#seal-gold)" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="url(#seal-gold)" strokeWidth="0.5" />
        <text fill="url(#seal-gold)" style={{ font: "400 10.5px 'Jost', sans-serif", letterSpacing: "3.2px" }}>
          <textPath href="#seal-path">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Emblem className="h-[34%]" />
      </div>
    </div>
  );
}
