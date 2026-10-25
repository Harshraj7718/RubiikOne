import { Link } from "react-router-dom";
import { Wordmark } from "./Logo.jsx";
import { Seal } from "./Ornament.jsx";
import { Marquee } from "./motion.jsx";
import { EdgeVeins } from "./GoldVeins.jsx";
import { CONTACT, dialable } from "../data/legal.js";
import { LAUNCH, formatDate } from "../data/catalog.js";
import { useShop } from "../lib/shop.jsx";

export default function Footer() {
  const { phase } = useShop();
  return (
    <footer className="relative isolate overflow-hidden border-t border-ivory/10 bg-night-900">
      <EdgeVeins corners={["top-right"]} seed={53} />
      <Marquee
        className="border-b border-ivory/10 py-6 font-serif text-3xl italic text-ivory/40 sm:text-5xl"
        items={["Precision in every dimension", "Two I's. One distinctive vision", "Your time. Your perspective"]}
        speed={60}
      />
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-20 sm:px-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-start gap-5">
          <Seal className="h-28 w-28" />
          <Wordmark className="text-3xl" />
          <p className="font-serif text-xl italic text-gold">Precision in every dimension.</p>
        </div>
        <div className="space-y-3 text-sm text-ivory-dim">
          <p className="eyebrow mb-5 text-ivory">The edition</p>
          <p>RUBIIK ONE · 200 numbered pieces across both models</p>
          {phase !== "launched" && <p>Pre-booking · {phase === "prebook" ? "open now" : `from ${formatDate(LAUNCH.prebookOpens)}`}</p>}
          <p>
            {phase === "launched" ? "Launched" : "Launch"} · {formatDate(LAUNCH.launch, { year: "numeric" })}
          </p>
        </div>
        <div className="space-y-3 text-sm text-ivory-dim">
          <p className="eyebrow mb-5 text-ivory">Client care</p>
          <p>All stainless steel · 5 ATM water resistant</p>
          <p>Complimentary insured delivery across India</p>
          <p>Each watch arrives with its edition certificate</p>
        </div>
        <address className="space-y-3 text-sm not-italic text-ivory-dim">
          <p className="eyebrow mb-5 text-ivory">Contact</p>
          <p>
            <a href={`tel:${dialable(CONTACT.phone)}`} className="transition-colors hover:text-gold">
              {CONTACT.phone}
            </a>
          </p>
          <p>
            <a href={`https://wa.me/${dialable(CONTACT.whatsapp).replace("+", "")}`} target="_blank" rel="noreferrer" className="transition-colors hover:text-gold">
              WhatsApp · {CONTACT.whatsapp}
            </a>
          </p>
          <p>
            <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-gold">
              {CONTACT.email}
            </a>
          </p>
          <p>
            <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noreferrer" className="transition-colors hover:text-gold">
              Instagram · @{CONTACT.instagram}
            </a>
          </p>
          <p className="pt-2 leading-relaxed">
            {CONTACT.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p className="text-ivory-mute">{CONTACT.hours}</p>
        </address>
      </div>
      <div className="relative select-none overflow-hidden">
        <p className="translate-y-[18%] text-center font-serif text-[22vw] leading-none text-ivory/[0.04]">RUBIIK</p>
      </div>
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 border-t border-ivory/10 px-5 py-6 text-[11px] uppercase tracking-wide2 text-ivory-mute sm:flex-row sm:px-10">
        <span>© {new Date().getFullYear()} RUBIIK</span>
        <nav className="flex gap-6">
          <Link to="/privacy" className="transition-colors hover:text-gold">
            Privacy Policy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-gold">
            Terms of Service
          </Link>
        </nav>
        <span>Est. MMXXVI</span>
      </div>
    </footer>
  );
}
