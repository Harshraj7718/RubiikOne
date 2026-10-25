// Turns the raw brand images into the web assets used by the site sections.
// Usage: node tools/process-images.mjs <source-dir>   (defaults to ./brand-source)
import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "brand-source");
const OUT = path.resolve("public/images");
await mkdir(OUT, { recursive: true });
await mkdir(path.resolve("brand-source"), { recursive: true });

const src = (f) => path.join(SRC, f);
const out = (f) => path.join(OUT, f);

// Keep an untouched copy of every source file inside the project.
if (SRC !== path.resolve("brand-source")) {
  for (const f of ["1.jpg", "2.jpg", "3.webp", "4.webp", "5.webp", "6.webp", "7.webp", "8.webp", "9.webp", "10.webp", "11.webp", "12.webp", "13.webp", "14.webp", "15.webp", "16.webp", "17.webp", "18.webp"]) {
    await copyFile(src(f), path.resolve("brand-source", f));
  }
}

// Removes the near-white studio background from a spec-sheet render, feathering the edge.
async function cutout(file, region, name, { lo = 228, hi = 246, seeds = [] } = {}) {
  const { data, info } = await sharp(src(file)).extract(region).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const min = Math.min(r, g, b);
    const chroma = Math.max(r, g, b) - min;
    // Bright and colourless = background; ramp between lo..hi for soft edges.
    const t = chroma > 18 ? 0 : (min - lo) / (hi - lo);
    alpha[i] = 255 * (1 - Math.min(1, Math.max(0, t)));
  }
  // Flood-fill from the border so only background connected to the edge becomes transparent
  // (keeps polished white highlights inside the watch opaque).
  const keep = new Uint8Array(width * height).fill(1);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  // Extra seeds open up enclosed background, e.g. the window of an exhibition caseback.
  for (const [sx, sy] of seeds) stack.push(Math.round(sy * height) * width + Math.round(sx * width));
  while (stack.length) {
    const p = stack.pop();
    if (!keep[p] || alpha[p] > 200) continue;
    keep[p] = 0;
    const x = p % width, y = (p / width) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  for (let i = 0; i < width * height; i++) data[i * 4 + 3] = keep[i] ? 255 : alpha[i];
  await sharp(data, { raw: { width, height, channels: 4 } }).trim().webp({ quality: 92, alphaQuality: 100 }).toFile(out(name));
  console.log("cutout", name);
}

// Width variants for responsive loading: phones get a 768px file instead of the full-size one.
// Each size is encoded straight from the original at the same quality, so nothing is re-compressed twice.
const VARIANT_WIDTHS = [768, 1152];
const manifest = {};

const crop = async (file, region, name, width = 1800) => {
  const base = () => (region ? sharp(src(file)).extract(region) : sharp(src(file)));
  const info = await base().resize({ width, withoutEnlargement: true }).webp({ quality: 86 }).toFile(out(name));
  const sizes = [[name, info.width]];
  for (const w of VARIANT_WIDTHS.filter((w) => w < info.width - 100)) {
    const variant = name.replace(/\.webp$/, `-${w}.webp`);
    await base().resize({ width: w }).webp({ quality: 86 }).toFile(out(variant));
    sizes.unshift([variant, w]);
  }
  manifest[name] = sizes;
  console.log("crop", name, sizes.map(([, w]) => w).join("/"));
};

// Product cut-outs from the spec sheets (watch, crown and caseback).
await cutout("1.jpg", { left: 230, top: 140, width: 518, height: 830 }, "skeleton-watch.webp");
await cutout("1.jpg", { left: 930, top: 320, width: 420, height: 420 }, "skeleton-caseback.webp", { seeds: [[0.5, 0.5]] });
await cutout("1.jpg", { left: 815, top: 490, width: 90, height: 70 }, "skeleton-crown.webp");
await cutout("2.jpg", { left: 285, top: 160, width: 470, height: 830 }, "olive-watch.webp");
await cutout("2.jpg", { left: 925, top: 295, width: 430, height: 445 }, "olive-caseback.webp");

// Lifestyle / campaign imagery, cropped per section (baked-in ad text removed where present).
await crop("4.webp", null, "logo-green.webp", 2000);
await crop("5.webp", null, "olive-driftwood.webp", 1200);
await crop("6.webp", null, "olive-wrist-dark.webp");
await crop("7.webp", null, "olive-voyage.webp");
await crop("8.webp", null, "skeleton-underwater.webp");
await crop("9.webp", null, "skeleton-cuff.webp");
await crop("10.webp", null, "olive-silk.webp");
await crop("16.webp", null, "skeleton-desert.webp");
await crop("11.webp", { left: 40, top: 40, width: 1456, height: 944 }, "skeleton-compass.webp");
await crop("12.webp", { left: 600, top: 180, width: 936, height: 844 }, "duo-flatlay.webp", 1400);
await crop("13.webp", { left: 470, top: 640, width: 554, height: 896 }, "olive-poster-closeup.webp", 1000);
await crop("13.webp", { left: 0, top: 0, width: 600, height: 900 }, "olive-gentleman.webp", 1000);
await crop("14.webp", { left: 1000, top: 0, width: 595, height: 986 }, "skeleton-closeup.webp", 1100);
await crop("14.webp", { left: 0, top: 80, width: 560, height: 906 }, "skeleton-bw-wrist.webp", 1000);
await crop("15.webp", { left: 1000, top: 0, width: 595, height: 986 }, "olive-closeup.webp", 1100);
await crop("15.webp", { left: 0, top: 80, width: 560, height: 906 }, "olive-bw-wrist.webp", 1000);

// Landscape skies (above the watch in each campaign shot) for the blueprint sections.
await crop("16.webp", { left: 0, top: 0, width: 1536, height: 400 }, "sky-desert.webp", 2000);
await crop("7.webp", { left: 0, top: 0, width: 1536, height: 400 }, "sky-coast.webp", 2000);

// Engraved line drawing of a cut-out: Sobel edges on luminance plus the silhouette, as ivory strokes.
async function lineArt(input, name, { gain = 2.2, floor = 26 } = {}) {
  const base = sharp(out(input)).resize({ height: 1600 });
  const { data, info } = await base.clone().ensureAlpha().blur(1.1).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = new Float32Array(w * h);
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    a[i] = data[i * 4 + 3];
    // Composite on mid-grey so the silhouette edge registers in luminance too.
    const k = a[i] / 255;
    lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) * k + 128 * (1 - k);
  }
  const outBuf = Buffer.alloc(w * h * 4);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1] - lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1];
      const gy = lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1] - lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1];
      const ax = a[p + 1] - a[p - 1];
      const ay = a[p + w] - a[p - w];
      const mag = Math.max(Math.hypot(gx, gy) / 4, Math.hypot(ax, ay) * 1.5);
      const v = Math.max(0, Math.min(255, (mag - floor) * gain));
      outBuf[p * 4] = 239;
      outBuf[p * 4 + 1] = 233;
      outBuf[p * 4 + 2] = 223;
      outBuf[p * 4 + 3] = v;
    }
  }
  await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(out(name));
  console.log("line art", name);
}
await lineArt("skeleton-watch.webp", "skeleton-lineart.webp");
await lineArt("olive-watch.webp", "olive-lineart.webp");

// Which responsive sizes exist for each photo; read by src/lib/img.js to build srcset.
await writeFile(path.resolve("src/data/images.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote src/data/images.json");

