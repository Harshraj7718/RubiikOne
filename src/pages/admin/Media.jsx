// Media library: every image the website uses (with where it's used) plus the original brand files.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, Panel, Loading, useAdminData, fmtBytes } from "./ui.jsx";

const GROUPS = [
  ["Watch cut-outs", (n) => /-(watch|caseback|crown)\./.test(n), true],
  ["Line art", (n) => n.includes("lineart"), true],
  ["Campaign & lifestyle", (n) => !/-(watch|caseback|crown)\.|lineart|^sky-|^logo/.test(n), false],
  ["Backgrounds & skies", (n) => n.startsWith("sky-"), false],
  ["Brand & logo", (n) => n.startsWith("logo"), false],
];
// "sections/Hero.jsx" → "Hero"; images referenced in the product catalog feed several pages.
const usageLabel = (file) => (file === "data/catalog.js" ? "Product data" : file.split("/").pop().replace(/\.(jsx?|tsx?|css)$/, ""));

export default function Media() {
  const state = useAdminData("/api/admin/assets");
  const [preview, setPreview] = useState(null);
  const site = state.data?.site ?? [];
  const originals = state.data?.originals ?? [];

  return (
    <>
      <PageHeader title="Media library" subtitle={`${site.length} images used across the website, and ${originals.length} original brand files.`} />
      <Loading state={state}>
        <div className="space-y-8">
          {GROUPS.map(([title, test, transparent]) => {
            const items = site.filter((a) => test(a.name));
            if (!items.length) return null;
            return (
              <Panel key={title} title={`${title} · ${items.length}`}>
                <Grid items={items} transparent={transparent} onOpen={setPreview} />
              </Panel>
            );
          })}
          <Panel title={`Original brand files · ${originals.length}`}>
            <p className="mb-4 text-sm text-ivory-dim">The source images the site's cut-outs and crops were made from. These are private: only admins can open them.</p>
            <Grid items={originals} onOpen={setPreview} />
          </Panel>
        </div>
      </Loading>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-black/85 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <img src={preview.url} alt={preview.name} className="max-h-[80vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
            <div className="flex items-center gap-4 text-sm">
              <span className="text-ivory-dim">{preview.name}</span>
              <a href={preview.url} download={preview.name} className="btn-gold !px-5 !py-2" onClick={(e) => e.stopPropagation()}>
                Download
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Grid({ items, transparent = false, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((a) => (
        <Asset key={a.url} asset={a} transparent={transparent} onOpen={onOpen} />
      ))}
    </div>
  );
}

function Asset({ asset, transparent, onOpen }) {
  const [dims, setDims] = useState(null);
  return (
    <figure className="group flex flex-col border border-ivory/10 bg-night-900/60">
      <button
        onClick={() => onOpen(asset)}
        className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden ${
          transparent ? "bg-[conic-gradient(#1a2430_25%,#141c26_0_50%,#1a2430_0_75%,#141c26_0)] bg-[length:16px_16px]" : "bg-night-800"
        }`}
        aria-label={`Preview ${asset.name}`}
      >
        <img
          src={asset.url}
          alt={asset.name}
          loading="lazy"
          onLoad={(e) => setDims([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight])}
          className={`transition-transform duration-500 group-hover:scale-105 ${transparent ? "max-h-[88%] w-auto object-contain" : "h-full w-full object-cover"}`}
        />
      </button>
      <figcaption className="flex flex-1 flex-col gap-2 p-3 text-xs">
        <p className="break-all text-ivory">{asset.name}</p>
        <p className="text-ivory-mute">
          {dims ? `${dims[0]} × ${dims[1]}` : "…"} · {fmtBytes(asset.bytes)}
        </p>
        {asset.usedIn && (
          <div className="flex flex-wrap gap-1">
            {asset.usedIn.length ? (
              asset.usedIn.map((f) => (
                <span key={f} title={f} className="border border-gold/30 px-1.5 py-0.5 text-[10px] text-gold-light">
                  {usageLabel(f)}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-ivory-mute">Not used on the site</span>
            )}
          </div>
        )}
        <a href={asset.url} download={asset.name} className="mt-auto pt-1 text-[10px] uppercase tracking-[0.2em] text-ivory-mute hover:text-gold">
          Download
        </a>
      </figcaption>
    </figure>
  );
}
