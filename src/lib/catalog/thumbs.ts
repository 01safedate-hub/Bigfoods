import type { Product } from "./types";

const STOP = new Set(["and", "for", "the", "with", "men", "women", "kids", "all"]);

/** "Lace front wigs" -> ["lace", "front", "wig"]: the words a product name should contain. */
export function keywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("es") && !w.endsWith("ses") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

/**
 * First photos of the best sellers that fit a tile: in the category (if given) and, if words are given,
 * naming all of them, else any of them, else just the category. Empty when nothing fits.
 */
export function imagesFor(products: Product[], opts: { category?: string | string[]; name?: string; wholesale?: boolean }, n = 4): string[] {
  const cats = opts.category === undefined ? null : new Set([opts.category].flat());
  const pool = products
    .filter((p) => p.images[0] && (!cats || cats.has(p.category)) && (!opts.wholesale || p.wholesale))
    .sort((a, b) => b.sold - a.sold);
  const words = opts.name ? keywords(opts.name) : [];
  const has = (p: Product, w: string) => p.name.toLowerCase().includes(w);
  const tiers = words.length
    ? [pool.filter((p) => words.every((w) => has(p, w))), pool.filter((p) => words.some((w) => has(p, w))), cats ? pool : []]
    : [pool];
  const hit = tiers.find((t) => t.length) ?? [];
  return hit.slice(0, n).map((p) => p.images[0]);
}

/** One set of photos per key, for passing to client components. */
export function imageMap<K extends string>(products: Product[], specs: Record<K, Parameters<typeof imagesFor>[1]>, n = 4): Record<K, string[]> {
  return Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, imagesFor(products, s as Parameters<typeof imagesFor>[1], n)])) as Record<K, string[]>;
}
