"use client";

import { useSyncExternalStore } from "react";
import type { Product, Variant } from "@/lib/catalog/types";
import type { IconKey } from "@/lib/catalog/types";

/** The wholesale cart is separate from the shop cart: different prices, sea only, own checkout. */
export interface WCartLine {
  slug: string;
  variantId: string;
  qty: number;
  name: string;
  label: string;
  unit: number;
  image: string | null;
  tint: string;
  icon: IconKey;
}

const KEY = "fc-wholesale-cart";
const EMPTY: WCartLine[] = [];
let cache: WCartLine[] | null = null;
const listeners = new Set<() => void>();

function load(): WCartLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as WCartLine[]).filter((l) => l && l.slug && l.variantId && l.qty > 0) : [];
  } catch {
    cache = [];
  }
  return cache;
}
function save(next: WCartLine[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or private mode: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

const label = (v: Variant) => Object.values(v.props).join(" / ");
const lineOf = (p: Product, v: Variant, qty: number): WCartLine => ({
  slug: p.slug, variantId: v.id, qty, name: p.name, label: label(v), unit: v.wholesale, image: v.image ?? p.images[0] ?? null, tint: p.tint, icon: p.icon,
});

export const wcart = {
  /** Adds units (or sets them with `set`). */
  add(p: Product, v: Variant, qty: number, set = false) {
    const lines = [...load()];
    const i = lines.findIndex((l) => l.variantId === v.id && l.slug === p.slug);
    const n = Math.min(9999, Math.max(0, Math.round(qty)));
    if (i >= 0) {
      const q = set ? n : lines[i].qty + n;
      if (q <= 0) lines.splice(i, 1);
      else lines[i] = { ...lines[i], qty: q, unit: v.wholesale };
    } else if (n > 0) lines.push(lineOf(p, v, n));
    save(lines);
  },
  addMany(items: { product: Product; variant: Variant; qty: number }[]) {
    const lines = [...load()];
    for (const { product, variant, qty } of items) {
      const i = lines.findIndex((l) => l.variantId === variant.id && l.slug === product.slug);
      if (i >= 0) lines[i] = { ...lines[i], qty: lines[i].qty + qty };
      else lines.push(lineOf(product, variant, qty));
    }
    save(lines);
  },
  setQty(slug: string, variantId: string, qty: number) {
    save(load().flatMap((l) => (l.slug === slug && l.variantId === variantId ? (qty > 0 ? [{ ...l, qty: Math.min(9999, Math.round(qty)) }] : []) : [l])));
  },
  /** Server prices win: updates units whose price moved. */
  reprice(prices: Map<string, number>) {
    const cur = load();
    if (!cur.some((l) => prices.has(l.variantId) && prices.get(l.variantId) !== l.unit)) return;
    save(cur.map((l) => (prices.has(l.variantId) ? { ...l, unit: prices.get(l.variantId)! } : l)));
  },
  removeVariants(ids: Set<string>) {
    save(load().filter((l) => !ids.has(l.variantId)));
  },
  removeProduct(slug: string) {
    save(load().filter((l) => l.slug !== slug));
  },
  clear() {
    save([]);
  },
};

export function useWholesaleCart(): WCartLine[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}
