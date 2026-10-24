// Certificate of Edition: the owner's card for one numbered RUBIIK ONE.
// `size="lg"` for the owner's own view, `size="sm"` for the Founding Owners wall.
import { findProduct, LAUNCH } from "../data/catalog.js";
import { Tilt } from "./motion.jsx";
import { Emblem } from "./Logo.jsx";

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const pad3 = (n) => String(n).padStart(3, "0");

export default function Certificate({ cert, name, size = "lg", className = "" }) {
  const product = findProduct(cert.slug);
  const lg = size === "lg";
  return (
    <Tilt className={`group relative ${className}`} max={lg ? 6 : 4}>
      <div
        className={`relative overflow-hidden border border-gold/40 bg-[linear-gradient(135deg,#141F2A_0%,#0B1219_55%,#141F2A_100%)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ${
          lg ? "aspect-[1.6/1] p-5 sm:p-8" : "aspect-[1.6/1] w-[300px] p-4 sm:w-[340px]"
        }`}
      >
        {/* Engraved texture, inner frame and a foil glint on hover */}
        <div className="damask pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="pointer-events-none absolute inset-2 border border-gold/20 sm:inset-3" />
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_35%,rgba(246,227,180,0.18)_50%,transparent_65%)] transition-transform duration-[1.4s] ease-lux group-hover:translate-x-full" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-3xl" style={{ background: product.accent }} />

        <div className="relative flex h-full gap-3 sm:gap-6">
          <div className="flex w-[34%] shrink-0 items-center justify-center">
            <img src={product.images.cutout} alt={cert.model} className="max-h-full w-auto drop-shadow-[0_14px_20px_rgba(0,0,0,0.6)]" draggable={false} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`uppercase text-gold ${lg ? "text-[9px] tracking-[0.3em] sm:text-[10px]" : "text-[8px] tracking-[0.25em]"}`}>Certificate of Edition</p>
                <p className={`font-serif leading-tight ${lg ? "mt-1 text-lg sm:text-2xl" : "mt-0.5 text-sm"}`}>{product.edition}</p>
              </div>
              <Emblem className={lg ? "h-6 shrink-0 sm:h-8" : "h-5 shrink-0"} />
            </div>

            <div className="mt-auto">
              <p className={`uppercase text-ivory-mute ${lg ? "text-[9px] tracking-[0.25em]" : "text-[7px] tracking-[0.2em]"}`}>Owned by</p>
              <p className={`truncate font-serif italic ${lg ? "text-2xl sm:text-4xl" : "text-lg"}`}>{name}</p>
            </div>

            {/* The serial must always show in full, so this row wraps rather than truncates. */}
            <div className={`flex flex-wrap items-end justify-between gap-x-2 gap-y-1 border-t border-gold/25 ${lg ? "mt-3 pt-3 sm:mt-4" : "mt-2 pt-2"}`}>
              <div>
                <p className={`uppercase text-ivory-mute ${lg ? "text-[8px] tracking-[0.25em] sm:text-[9px]" : "text-[7px] tracking-[0.2em]"}`}>Serial</p>
                <p className={`whitespace-nowrap font-sans text-ivory ${lg ? "text-[10px] tracking-[0.04em] sm:text-sm sm:tracking-[0.12em]" : "text-[10px] tracking-[0.08em]"}`}>{cert.serial}</p>
              </div>
              <p className={`shrink-0 font-serif leading-none ${lg ? "text-xl sm:text-4xl" : "text-xl"}`}>
                <span className="text-gold">No. {pad3(cert.number)}</span>
                <span className={`text-ivory-mute ${lg ? "text-sm sm:text-lg" : "text-xs"}`}> / {LAUNCH.editionSize}</span>
              </p>
            </div>
            {lg && <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-ivory-mute">Issued {fmtDate(cert.issuedAt)}</p>}
          </div>
        </div>
      </div>
    </Tilt>
  );
}
