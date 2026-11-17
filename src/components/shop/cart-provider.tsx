"use client";

import { createContext, useContext, useMemo } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { productBySlug } from "@/lib/catalog/products";
import type { Product } from "@/lib/catalog/types";

export interface CartItem {
  key: string;
  slug: string;
  qty: number;
  option?: string;
  color?: string;
  size?: string;
  /** Unit price when added, to show "₦X less than when added". */
  addedPrice: number;
  selected: boolean;
}

export interface ResolvedItem extends CartItem {
  product: Product;
  /** Product with the chosen cost option applied (e.g. 256GB). */
  costed: Product;
}

interface CartApi {
  items: ResolvedItem[];
  count: number;
  add: (item: Omit<CartItem, "key" | "selected">) => void;
  setQty: (key: string, qty: number) => void;
  toggle: (key: string) => void;
  setAll: (selected: boolean) => void;
  remove: (key: string) => void;
}

const CartContext = createContext<CartApi | null>(null);

/** Demo cart until accounts are connected to Supabase. */
const DEMO: CartItem[] = [
  { key: "amoled-android-phone-5g|256GB|Midnight Black|", slug: "amoled-android-phone-5g", qty: 1, option: "256GB", color: "Midnight Black", addedPrice: 276_000, selected: true },
  { key: "satin-cowl-neck-midi-dress||Wine|M", slug: "satin-cowl-neck-midi-dress", qty: 1, color: "Wine", size: "M", addedPrice: 18_000, selected: true },
  { key: "body-wave-lace-front-wig-22||Natural black|22\"", slug: "body-wave-lace-front-wig-22", qty: 1, color: "Natural black", size: '22"', addedPrice: 80_000, selected: true },
];

export function withOption(product: Product, option?: string): Product {
  const o = product.options?.find((x) => x.label === option);
  return o ? { ...product, cny: o.cny } : product;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = usePersistentState<CartItem[]>("fc-cart-v1", DEMO);

  const api = useMemo<CartApi>(() => {
    const items: ResolvedItem[] = [];
    for (const it of raw) {
      const product = productBySlug(it.slug);
      if (product) items.push({ ...it, product, costed: withOption(product, it.option) });
    }
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      add: (item) => {
        const key = [item.slug, item.option ?? "", item.color ?? "", item.size ?? ""].join("|");
        setRaw((prev) => {
          const found = prev.find((p) => p.key === key);
          if (found) return prev.map((p) => (p.key === key ? { ...p, qty: p.qty + item.qty } : p));
          return [...prev, { ...item, key, selected: true }];
        });
      },
      setQty: (key, qty) => setRaw((prev) => prev.map((p) => (p.key === key ? { ...p, qty: Math.max(1, qty) } : p))),
      toggle: (key) => setRaw((prev) => prev.map((p) => (p.key === key ? { ...p, selected: !p.selected } : p))),
      setAll: (selected) => setRaw((prev) => prev.map((p) => ({ ...p, selected }))),
      remove: (key) => setRaw((prev) => prev.filter((p) => p.key !== key)),
    };
  }, [raw, setRaw]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
