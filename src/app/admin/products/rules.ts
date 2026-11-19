import type { IconKey } from "@/lib/catalog/types";
import { CATEGORY_KEYS } from "@/lib/content/category-pages";
import type { CategoryKey } from "@/lib/pricing/engine";

/** What the Add product form sends. Checked again here: never trust the browser. */
export interface CustomProductInput {
  title: string;
  description: string;
  category: CategoryKey;
  status: "draft" | "active";
  badge: string;
  weight_kg: number;
  cbm: number | null;
  domestic_cny: number;
  images: string[];
  options: { name: string; values: string[] }[];
  specs: [string, string][];
  variants: { props: Record<string, string>; cost: number; currency: "cny" | "ngn"; stock: number; image: string | null }[];
}

export const CATEGORY_ICON: Record<CategoryKey, IconKey> = {
  gadgets: "phone", fashion: "dress", hair: "wig", beauty: "lipstick", jewellery: "watch", audio: "audio",
  shoes: "shoe", bags: "bag", home: "home", kids: "kids", furniture: "sofa", machines: "machine",
};

export const LIMITS = { images: 10, options: 3, values: 30, variants: 100, specs: 20 } as const;

/** Every combination of the option values, e.g. Colour × Size. */
export function combinations(options: { name: string; values: string[] }[]): Record<string, string>[] {
  const used = options.filter((o) => o.name.trim() && o.values.length);
  return used.reduce<Record<string, string>[]>((acc, o) => acc.flatMap((a) => o.values.map((v) => ({ ...a, [o.name.trim()]: v }))), [{}]);
}

type Check<T> = { ok: true; value: T } | { ok: false; message: string };
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number.NaN);

/** `imagePrefix`: images must live in our own storage (null in demo mode). */
export function validateCustomProduct(raw: unknown, imagePrefix: string | null): Check<CustomProductInput> {
  if (!raw || typeof raw !== "object") return { ok: false, message: "Nothing to save." };
  const r = raw as Record<string, unknown>;
  const title = str(r.title, 140);
  if (title.length < 3) return { ok: false, message: "Give the product a name (at least 3 characters)." };
  const category = r.category as CategoryKey;
  if (!CATEGORY_KEYS.includes(category)) return { ok: false, message: "Choose a category." };
  const weight = num(r.weight_kg);
  if (!(weight > 0 && weight <= 2000)) return { ok: false, message: "Enter the weight per item in kg (for shipping cost)." };
  const cbm = r.cbm === null || r.cbm === undefined || r.cbm === "" ? null : num(r.cbm);
  if (cbm !== null && !(cbm > 0 && cbm <= 70)) return { ok: false, message: "Volume (CBM) must be between 0 and 70." };
  const domestic = r.domestic_cny === undefined ? 0 : num(r.domestic_cny);
  if (!(domestic >= 0 && domestic <= 10_000)) return { ok: false, message: "China delivery cost must be ¥0–¥10,000." };

  const images = Array.isArray(r.images) ? r.images.filter((u): u is string => typeof u === "string").slice(0, LIMITS.images) : [];
  if (imagePrefix && images.some((u) => !u.startsWith(imagePrefix))) return { ok: false, message: "Photos must be uploaded here, not linked from another site." };

  const options = (Array.isArray(r.options) ? r.options : []).slice(0, LIMITS.options).map((o) => {
    const x = (o ?? {}) as Record<string, unknown>;
    const values = Array.isArray(x.values) ? [...new Set(x.values.map((v) => str(v, 40)).filter(Boolean))].slice(0, LIMITS.values) : [];
    return { name: str(x.name, 30), values };
  }).filter((o) => o.name && o.values.length);
  if (new Set(options.map((o) => o.name.toLowerCase())).size !== options.length) return { ok: false, message: "Two options have the same name." };

  const specs = (Array.isArray(r.specs) ? r.specs : [])
    .map((s) => (Array.isArray(s) ? [str(s[0], 40), str(s[1], 120)] : ["", ""]) as [string, string])
    .filter(([k, v]) => k && v)
    .slice(0, LIMITS.specs);

  const rawVariants = Array.isArray(r.variants) ? r.variants : [];
  if (!rawVariants.length) return { ok: false, message: "Add at least one variant with a cost." };
  if (rawVariants.length > LIMITS.variants) return { ok: false, message: `Up to ${LIMITS.variants} variants.` };
  const expected = combinations(options).map((c) => JSON.stringify(c));
  const variants: CustomProductInput["variants"] = [];
  for (const [i, v] of rawVariants.entries()) {
    const x = (v ?? {}) as Record<string, unknown>;
    const props = (x.props && typeof x.props === "object" ? x.props : {}) as Record<string, string>;
    if (!expected.includes(JSON.stringify(props))) return { ok: false, message: `Variant ${i + 1} doesn't match the options. Rebuild the variants.` };
    const currency = x.currency === "ngn" ? "ngn" : "cny";
    const cost = num(x.cost);
    const max = currency === "ngn" ? 50_000_000 : 200_000;
    if (!(cost > 0 && cost <= max)) return { ok: false, message: `Enter a cost for ${Object.values(props).join(" / ") || "the product"}.` };
    const stock = Math.trunc(num(x.stock));
    if (!(stock >= 0 && stock <= 1_000_000)) return { ok: false, message: "Stock must be 0 or more." };
    const image = typeof x.image === "string" && images.includes(x.image) ? x.image : null;
    variants.push({ props, cost, currency, stock, image });
  }

  return {
    ok: true,
    value: {
      title, category, images, options, specs, variants, cbm,
      description: str(r.description, 4000),
      status: r.status === "active" ? "active" : "draft",
      badge: str(r.badge, 16),
      weight_kg: weight,
      domestic_cny: domestic,
    },
  };
}
