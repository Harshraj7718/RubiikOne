import { Wordmark } from "./Logo.jsx";
import { Seal } from "./Ornament.jsx";
import { Marquee } from "./motion.jsx";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ivory/10 bg-night-900">
      <Marquee
        className="border-b border-ivory/10 py-6 font-serif text-3xl italic text-ivory/40 sm:text-5xl"
        items={["Precision in every dimension", "Two I's. One distinctive vision", "Your time. Your perspective"]}
        speed={60}
      />
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-20 sm:px-10 md:grid-cols-3">
        <div className="flex flex-col items-start gap-5">
          <Seal className="h-28 w-28" />
          <Wordmark className="text-3xl" />
          <p className="font-serif text-xl italic text-gold">Precision in every dimension.</p>
        </div>
        <div className="space-y-3 text-sm text-ivory-dim">
          <p className="eyebrow mb-5 text-ivory">The edition</p>
          <p>RUBIIK ONE · 200 numbered pieces across both models</p>
          <p>Pre-booking · from 6 November</p>
          <p>Launch · 25 December, Christmas Day</p>
        </div>
        <div className="space-y-3 text-sm text-ivory-dim">
          <p className="eyebrow mb-5 text-ivory">Client care</p>
          <p>All stainless steel · 5 ATM water resistant</p>
          <p>Complimentary insured delivery across India</p>
          <p>Each watch arrives with its edition certificate</p>
        </div>
      </div>
      <div className="relative select-none overflow-hidden">
        <p className="translate-y-[18%] text-center font-serif text-[22vw] leading-none text-ivory/[0.04]">RUBIIK</p>
      </div>
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 border-t border-ivory/10 px-5 py-6 text-[11px] uppercase tracking-wide2 text-ivory-mute sm:flex-row sm:px-10">
        <span>© {new Date().getFullYear()} RUBIIK</span>
        <span>Est. MMXXVI</span>
      </div>
    </footer>
  );
}
