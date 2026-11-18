import type { Product, Variant } from "./types";

export type Choice = Record<string, string>;
export const LOW_STOCK = 5;

const matches = (v: Variant, choice: Choice, except?: string) =>
  Object.entries(choice).every(([k, val]) => k === except || !val || v.props[k] === val);

/** The variant for a full choice, if it exists. */
export function findVariant(p: Pick<Product, "options" | "variants">, choice: Choice): Variant | undefined {
  if (!p.options.length) return p.variants[0];
  return p.variants.find((v) => p.options.every((o) => v.props[o.name] === choice[o.name]));
}

/** Best starting choice: the first combination that's in stock (falls back to the first variant). */
export function initialChoice(p: Pick<Product, "options" | "variants">): Choice {
  const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0];
  return Object.fromEntries(p.options.map((o) => [o.name, v?.props[o.name] ?? o.values[0]?.label ?? ""]));
}

export interface ValueState {
  label: string;
  hex?: string;
  /** A variant exists with this value and the other current choices. */
  exists: boolean;
  /** …and it's in stock. */
  inStock: boolean;
  /** Price difference against the currently selected variant (0 when same or unknown). */
  delta: number;
  image?: string | null;
}

/**
 * For each option value: can it be picked with the other current choices, is it in stock, and how
 * does the price change. If a value only exists with different other choices, it's still pickable
 * (exists=false) and choosing it moves the other options to the nearest in-stock combination.
 */
export function optionStates(p: Pick<Product, "options" | "variants">, choice: Choice, priceOf: (v: Variant) => number): Record<string, ValueState[]> {
  const current = findVariant(p, choice);
  const base = current ? priceOf(current) : 0;
  return Object.fromEntries(
    p.options.map((o) => [
      o.name,
      o.values.map((val) => {
        const v = p.variants.find((x) => x.props[o.name] === val.label && matches(x, choice, o.name));
        return { label: val.label, hex: val.hex, exists: Boolean(v), inStock: Boolean(v && v.stock > 0), delta: v && current ? priceOf(v) - base : 0, image: v?.image };
      }),
    ]),
  );
}

/** Picks a value; if that combination doesn't exist or is sold out, adjusts the other options to the best match. */
export function choose(p: Pick<Product, "options" | "variants">, choice: Choice, option: string, value: string): Choice {
  const next = { ...choice, [option]: value };
  const exact = findVariant(p, next);
  if (exact && exact.stock > 0) return next;
  const candidates = p.variants.filter((v) => v.props[option] === value);
  // Keep as many of the other choices as possible, preferring in-stock variants.
  const score = (v: Variant) => (v.stock > 0 ? 100 : 0) + p.options.filter((o) => o.name !== option && v.props[o.name] === choice[o.name]).length;
  const best = candidates.sort((a, b) => score(b) - score(a))[0];
  return best ? Object.fromEntries(p.options.map((o) => [o.name, best.props[o.name]])) : next;
}

/** Lowest and highest price across in-stock variants (for "From ₦…" labels). */
export function priceRange(p: Pick<Product, "variants">, priceOf: (v: Variant) => number) {
  const live = p.variants.filter((v) => v.stock > 0);
  const prices = (live.length ? live : p.variants).map(priceOf);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
