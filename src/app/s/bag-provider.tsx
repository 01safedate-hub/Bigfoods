"use client";

import { createContext, use } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import type { IconKey } from "@/lib/catalog/types";

export interface BagItem { slug: string; variantId: string; qty: number; name: string; variantLabel: string; price: number; image: string | null; tint: string; icon: IconKey }

interface Bag { items: BagItem[]; add: (i: BagItem) => void; setQty: (variantId: string, qty: number) => void; clear: () => void; count: number }
const Ctx = createContext<Bag | null>(null);

/** Each store has its own bag on this device (separate from the FastChina marketplace cart). */
export function BagProvider({ store, children }: { store: string; children: React.ReactNode }) {
  const [items, setItems] = usePersistentState<BagItem[]>(`fc-bag-${store}`, []);
  const add = (i: BagItem) => setItems((all) => {
    const hit = all.find((x) => x.variantId === i.variantId);
    return hit ? all.map((x) => (x.variantId === i.variantId ? { ...x, qty: Math.min(99, x.qty + i.qty), price: i.price } : x)) : [...all, i];
  });
  const setQty = (variantId: string, qty: number) => setItems((all) => (qty <= 0 ? all.filter((x) => x.variantId !== variantId) : all.map((x) => (x.variantId === variantId ? { ...x, qty: Math.min(99, qty) } : x))));
  return <Ctx value={{ items, add, setQty, clear: () => setItems([]), count: items.reduce((n, i) => n + i.qty, 0) }}>{children}</Ctx>;
}

export function useBag(): Bag {
  const v = use(Ctx);
  if (!v) throw new Error("useBag must be used inside a store");
  return v;
}
