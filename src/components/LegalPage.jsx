// Shared layout for the Privacy Policy and Terms of Service: a quiet, readable column of numbered sections.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ease } from "./motion.jsx";
import { LEGAL } from "../data/legal.js";

export default function LegalPage({ title, intro, other, children }) {
  return (
    <section className="mx-auto min-h-screen max-w-3xl px-5 pb-28 pt-36 sm:px-10">
      <motion.header initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }}>
        <p className="eyebrow text-gold">Legal</p>
        <h1 className="mt-3 font-serif text-5xl sm:text-6xl">{title}</h1>
        <p className="mt-3 text-sm text-ivory-mute">Last updated: {LEGAL.updated}</p>
        <p className="mt-8 text-lg leading-relaxed text-ivory-dim">{intro}</p>
      </motion.header>
      <div className="mt-14 space-y-12">{children}</div>
      <div className="mt-16 flex flex-wrap gap-4 border-t border-ivory/10 pt-8">
        <Link to={other.to} className="btn-ghost">
          {other.label}
        </Link>
        <Link to="/" className="btn-ghost">
          Back to RUBIIK
        </Link>
      </div>
    </section>
  );
}

export function Section({ n, title, children }) {
  return (
    <section>
      <h2 className="flex items-baseline gap-4 font-serif text-3xl">
        <span className="text-base text-gold">{n}.</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-ivory-dim">{children}</div>
    </section>
  );
}

export function List({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export const Strong = ({ children }) => <span className="text-ivory">{children}</span>;

export const Mail = () => (
  <a href={`mailto:${LEGAL.contactEmail}`} className="text-gold underline-offset-4 hover:underline">
    {LEGAL.contactEmail}
  </a>
);
