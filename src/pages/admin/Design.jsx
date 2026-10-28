// Design system: the live colour palette, typography and the brand's design components.
import { useState } from "react";
import theme from "../../../tailwind.config.js";
import { Emblem, Wordmark } from "../../components/Logo.jsx";
import { Chapter, Divider, Seal } from "../../components/Ornament.jsx";
import GoldVeins from "../../components/GoldVeins.jsx";
import Certificate from "../../components/Certificate.jsx";
import { PageHeader, Panel } from "./ui.jsx";

const PALETTE_ORDER = ["night", "ivory", "wine", "gold", "olive", "gunmetal"];
const ROLES = {
  night: "Backgrounds",
  ivory: "Text and light sections",
  wine: "Crimson sections and accents",
  gold: "Accent: logo, numerals, buttons",
  olive: "Quartz model accent",
  gunmetal: "Automatic model accent",
};

export default function Design() {
  const colors = theme.theme.extend.colors;
  const fonts = theme.theme.extend.fontFamily;

  return (
    <>
      <PageHeader title="Design system" subtitle="The colours, type and components the website is built from. Colours come straight from the live theme." />
      <div className="space-y-8">
        <Panel title="Colour palette">
          <div className="space-y-6">
            {PALETTE_ORDER.filter((k) => colors[k]).map((name) => (
              <div key={name}>
                <p className="mb-2 text-sm">
                  <span className="font-serif text-xl capitalize">{name}</span>
                  <span className="ml-3 text-xs text-ivory-mute">{ROLES[name]}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {Object.entries(colors[name]).map(([shade, hex]) => (
                    <Swatch key={shade} token={shade === "DEFAULT" ? name : `${name}-${shade}`} hex={hex} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Typography">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-ivory-mute">Display · {fonts.serif[0].replace(/"/g, "")}</p>
              <p className="mt-3 font-serif text-5xl">Every second has a shape.</p>
              <p className="mt-2 font-serif text-3xl italic text-gold">Precision in every dimension.</p>
              <p className="mt-3 font-serif text-lg text-ivory-dim">Aa Bb Cc 0123456789 · Roman numerals I II III IV</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-ivory-mute">Body & UI · {fonts.sans[0].replace(/"/g, "")}</p>
              <p className="mt-3 text-lg leading-relaxed text-ivory-dim">
                RUBIIK ONE — an automatic skeleton and a quartz olive, each in a numbered edition of only 200 pieces.
              </p>
              <p className="eyebrow mt-4">Eyebrow label · The signature collection</p>
              <p className="mt-3 text-sm text-ivory-mute">Aa Bb Cc 0123456789 ₹46,000</p>
            </div>
          </div>
        </Panel>

        <Panel title="Logo & ornaments">
          <div className="grid items-center gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Specimen label="Emblem">
              <Emblem className="h-16" />
            </Specimen>
            <Specimen label="Wordmark">
              <Wordmark className="text-4xl" />
            </Specimen>
            <Specimen label="Seal">
              <Seal className="h-32 w-32" />
            </Specimen>
            <Specimen label="Gold foil text">
              <span className="text-gold font-serif text-4xl italic">Gold</span>
            </Specimen>
            <Specimen label="Chapter marker">
              <Chapter n="IV" title="The collection" />
            </Specimen>
            <Specimen label="Divider">
              <Divider width="w-20" />
            </Specimen>
            <Specimen label="Royal frame">
              <div className="frame-royal flex h-20 w-40 items-center justify-center bg-night-800 text-xs text-ivory-mute">frame-royal</div>
            </Specimen>
            <Specimen label="Gold-vein marble">
              <div className="relative h-32 w-full overflow-hidden border border-ivory/10 bg-[#0B1321]">
                <GoldVeins corner="top-right" ready className="h-auto w-[90%]" />
              </div>
            </Specimen>
          </div>
        </Panel>

        <Panel title="Buttons">
          <div className="flex flex-wrap gap-4">
            <button className="btn-gold">Reserve yours</button>
            <button className="btn-ghost">Explore</button>
            <button className="btn-gold" disabled>
              Disabled
            </button>
          </div>
        </Panel>

        <Panel title="Certificate of edition (sample)">
          <div className="max-w-2xl">
            <Certificate cert={{ slug: "rubiik-one-automatic", number: 1, serial: "RBK-AS-001-XXXX", model: "RUBIIK ONE Automatic Skeleton", issuedAt: new Date().toISOString() }} name="Sample Owner" size="lg" />
          </div>
          <p className="mt-3 text-xs text-ivory-mute">Sample data for reference only. Real certificates are issued when a payment completes.</p>
        </Panel>
      </div>
    </>
  );
}

function Swatch({ token, hex }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button onClick={copy} className="group border border-ivory/10 text-left transition-colors hover:border-gold/50" title="Copy hex">
      <span className="block h-14" style={{ background: hex }} />
      <span className="block px-2 py-1.5">
        <span className="block text-[11px] text-ivory">{token}</span>
        <span className="block text-[10px] uppercase text-ivory-mute">{copied ? "Copied" : hex}</span>
      </span>
    </button>
  );
}

function Specimen({ label, children }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex min-h-[8rem] w-full items-center justify-center">{children}</div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">{label}</p>
    </div>
  );
}
