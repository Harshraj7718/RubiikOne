// Certificate of Edition: the owner's card for one numbered RUBIIK ONE.
// A royal-blue product card: big serif title, the edition number set like a price, the serial in a
// pill, the watch breaking out of the card over a halo of light, and a pale side rail listing the
// neighbouring edition numbers with this one highlighted.
// `size="lg"` for the owner's own view, `size="sm"` for the Founding Owners wall and the admin.
// Everything is sized in container units (cqw), so the same design scales with the card's width.
import { findProduct, LAUNCH } from "../data/catalog.js";
import { Tilt } from "./motion.jsx";
import { Emblem } from "./Logo.jsx";

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const pad3 = (n) => String(n).padStart(3, "0");

export default function Certificate({ cert, name, size = "lg", className = "" }) {
  const product = findProduct(cert.slug);
  const lg = size === "lg";
  const movement = product.specs.find(([k]) => k === "Movement")?.[1].split(",")[0];
  // Font size in card widths, never below a readable minimum on small cards.
  const fs = (cqw, minPx) => ({ fontSize: `max(${cqw}cqw, ${minPx}px)` });
  // Up to three edition numbers either side of this one, kept within 1…editionSize.
  const first = Math.max(1, Math.min(cert.number - 3, LAUNCH.editionSize - 6));
  const rail = Array.from({ length: 7 }, (_, i) => first + i).filter((n) => n <= LAUNCH.editionSize);

  return (
    <Tilt className={`group relative ${lg ? "py-[4%]" : "w-[320px] py-4 sm:w-[380px]"} ${className}`} max={lg ? 6 : 4}>
      <div className="relative aspect-[1.72/1] w-full [container-type:inline-size]">
        {/* ---------- The card ---------- */}
        <div className="absolute inset-0 overflow-hidden rounded-[3.2cqw] bg-[linear-gradient(118deg,#2B4F8A_0%,#1C3A6C_42%,#102449_100%)] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
          {/* Light bloom and halo ring behind the watch */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_66%_47%,rgba(226,236,255,0.6)_0%,rgba(140,175,235,0.22)_17%,transparent_40%)]" />
          <div className="pointer-events-none absolute left-[66%] top-[47%] h-[37cqw] w-[37cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.35cqw] border-[#BFD3FF]/35 shadow-[0_0_6cqw_1cqw_rgba(170,200,255,0.35),inset_0_0_4cqw_rgba(170,200,255,0.25)]" />
          {/* Foil glint on hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.14)_50%,transparent_65%)] transition-transform duration-[1.4s] ease-lux group-hover:translate-x-full" />

          {/* Pale side rail: neighbouring edition numbers, this one highlighted */}
          <div className="absolute inset-y-0 right-0 flex w-[17%] flex-col items-center bg-[#E9EEF6] pt-[4.5cqw]">
            <Emblem className="h-[3cqw] min-h-[12px] text-[#1C3A6C]" />
            <div className="mt-auto flex flex-col items-center gap-[1.1cqw] pb-[5cqw]">
              {rail.map((n) => (
                <span
                  key={n}
                  className={`font-serif leading-none tabular-nums ${n === cert.number ? "font-medium text-[#1C3A6C]" : "text-[#1C3A6C]/40"}`}
                  style={fs(n === cert.number ? 3 : 2.3, n === cert.number ? 12 : 9)}
                >
                  {pad3(n)}
                </span>
              ))}
            </div>
          </div>

          {/* ---------- Text ---------- */}
          {/* Children never shrink (a truncated line would otherwise collapse to nothing); on narrow
              cards the label row and the small print are dropped instead (see .cert-wide in index.css). */}
          <div className="relative flex h-full w-[52%] flex-col py-[5cqw] pl-[5.5cqw] text-[#F4F7FC] [&>*]:shrink-0">
            {lg && (
              <p className="cert-wide flex flex-wrap gap-x-[2.6cqw] uppercase text-white/75" style={{ ...fs(1.15, 8), letterSpacing: "0.08em" }}>
                <span>Certificate of edition</span>
                <span>RUBIIK ONE</span>
                <span>Limited {LAUNCH.editionSize}</span>
                <span>Est. MMXXVI</span>
              </p>
            )}
            {/* Short label for small cards, and for large ones squeezed onto a phone */}
            <p className={`uppercase text-white/70 ${lg ? "cert-narrow" : ""}`} style={{ ...fs(2.2, 8), letterSpacing: "0.18em" }}>
              Certificate of edition
            </p>

            <h3 className={`font-serif uppercase leading-[1.02] ${lg ? "mt-[4.5cqw]" : "mt-[3cqw]"}`} style={{ ...fs(lg ? 4.6 : 5.6, 16), letterSpacing: "0.02em" }}>
              RUBIIK ONE
              <br />
              {product.edition}
            </h3>
            <p className="mt-[1.2cqw] text-white/75" style={fs(lg ? 1.5 : 2.4, 9)}>
              {product.finish} · {movement}
            </p>

            {/* The edition number sits where a product card shows its price */}
            <p className={`font-serif leading-none ${lg ? "mt-[3.4cqw]" : "mt-auto"}`} style={fs(lg ? 3.6 : 4.6, 18)}>
              No. {pad3(cert.number)}
              <span className="text-white/55" style={fs(lg ? 1.8 : 2.4, 10)}>
                {" "}
                / {LAUNCH.editionSize}
              </span>
            </p>

            <p className={`truncate font-serif italic text-white/90 ${lg ? "mt-[1.6cqw]" : "mt-[1.2cqw]"}`} style={fs(lg ? 2.2 : 3.2, 12)}>
              Owned by {name}
            </p>
            {lg && (
              <p className="cert-wide mt-[0.6cqw] max-w-[92%] text-white/65" style={fs(1.25, 9)}>
                One of {LAUNCH.editionSize} numbered pieces, never to be repeated. Issued {fmtDate(cert.issuedAt)}.
              </p>
            )}

            {/* Serial in a pill, beside a square badge, like the card's buttons */}
            <div className={`flex items-center gap-[1.4cqw] ${lg ? "mt-auto" : "mt-[2.4cqw]"}`}>
              <span
                className="whitespace-nowrap rounded-[1.4cqw] bg-[#0E1E3D] px-[2.4cqw] py-[1.2cqw] font-sans text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                style={{ ...fs(lg ? 1.45 : 2.2, 9), letterSpacing: "0.08em" }}
              >
                {cert.serial}
              </span>
              <span className="flex aspect-square h-[5cqw] min-h-[22px] items-center justify-center rounded-[1.2cqw] border border-white/50 bg-[#0E1E3D]/40">
                <Emblem className="h-[55%] text-gold-light" />
              </span>
            </div>
          </div>
        </div>

        {/* ---------- The watch, breaking out of the card ---------- */}
        <img
          loading="lazy"
          decoding="async"
          src={product.images.cutout}
          alt={cert.model ?? `${product.name} ${product.edition}`}
          className="pointer-events-none absolute right-[14%] top-[-7%] h-[114%] w-auto max-w-[44%] object-contain drop-shadow-[0_2.5cqw_3cqw_rgba(5,12,30,0.55)] transition-transform duration-700 ease-lux group-hover:scale-[1.03]"
          draggable={false}
        />
      </div>
    </Tilt>
  );
}
