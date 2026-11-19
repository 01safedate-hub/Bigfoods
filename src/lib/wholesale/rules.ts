import type { Product, Variant } from "@/lib/catalog/types";
import { PRICING } from "@/lib/pricing/config";
import type { CategoryKey } from "@/lib/pricing/engine";

/** Wholesale is sea only: plan for this many days from full payment. */
export const SEA_DAYS = [90, 120] as const;
export const MIN_QTY = PRICING.wholesaleMinQty;

export interface WLine {
  slug: string;
  variantId: string;
  qty: number;
}

export interface Kit {
  slug: string;
  title: string;
  subtitle: string;
  tone: "red" | "gold" | "blue" | "green" | "black" | "pink";
  categories: CategoryKey[];
  maxProducts: number;
  unitsEach: number;
}

/** Used when the database isn't connected; Admin → Wholesale edits the live ones. */
export const DEFAULT_KITS: Kit[] = [
  { slug: "fashion-store", title: "Start a fashion store", subtitle: "Best-selling dresses, sets, shoes and bags to open with.", tone: "red", categories: ["fashion", "shoes", "bags"], maxProducts: 8, unitsEach: 10 },
  { slug: "phone-business", title: "Start a phone & accessories business", subtitle: "Phones plus the earbuds and chargers that sell with them.", tone: "black", categories: ["gadgets", "audio"], maxProducts: 8, unitsEach: 10 },
  { slug: "hair-beauty", title: "Open a hair & beauty shop", subtitle: "Wigs, bundles, lashes and makeup salons reorder every week.", tone: "pink", categories: ["hair", "beauty"], maxProducts: 8, unitsEach: 10 },
  { slug: "jewellery-watches", title: "Jewellery & watches stall", subtitle: "Small, light and high margin: easy to start with.", tone: "gold", categories: ["jewellery"], maxProducts: 6, unitsEach: 10 },
  { slug: "home-kitchen", title: "Home & kitchen shop", subtitle: "Everyday home items that move fast.", tone: "green", categories: ["home", "kids"], maxProducts: 8, unitsEach: 10 },
];

/** The variant a kit or quick add uses: the first one in stock. */
export const defaultVariant = (p: Product): Variant | undefined => p.variants.find((v) => v.stock > 0 && v.wholesale > 0) ?? undefined;

/** Fills a kit automatically: best sellers in its categories, one default variant each. */
export function kitLines(kit: Kit, products: Product[]): { product: Product; variant: Variant; qty: number }[] {
  return products
    .filter((p) => p.wholesale && kit.categories.includes(p.category))
    .sort((a, b) => b.sold - a.sold)
    .flatMap((product) => {
      const variant = defaultVariant(product);
      return variant ? [{ product, variant, qty: Math.max(kit.unitsEach, MIN_QTY) }] : [];
    })
    .slice(0, kit.maxProducts);
}

/** Units per product, all variants together. */
export function unitsByProduct(lines: WLine[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.slug, (m.get(l.slug) ?? 0) + l.qty);
  return m;
}

/** Products in the cart that are still under the minimum. */
export function shortProducts(lines: WLine[]): string[] {
  return [...unitsByProduct(lines)].filter(([, n]) => n < MIN_QTY).map(([slug]) => slug);
}

/** Wholesale search: every word must match the name, category or description. */
export function matches(p: Product, q: string, categoryName: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${p.name} ${categoryName} ${p.description}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}
