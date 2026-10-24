// Responsive image attributes. tools/process-images.mjs writes images.json with every size it
// produced (e.g. a 768px version for phones next to the full-size file, both at the same quality).
import manifest from "../data/images.json";

/**
 * Spread onto an <img>: `<img {...responsive("/images/olive-silk.webp", "100vw")} />`.
 * `sizes` tells the browser how wide the image is drawn, so it downloads the smallest file
 * that still covers it at full sharpness (accounting for screen density).
 */
export function responsive(src, sizes = "100vw") {
  const variants = manifest[src.split("/").pop()];
  if (!variants || variants.length < 2) return { src };
  return { src, srcSet: variants.map(([file, w]) => `/images/${file} ${w}w`).join(", "), sizes };
}
