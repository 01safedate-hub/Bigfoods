"use client";

import { createContext, useContext, useMemo } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import type { IconKey, PriceSet, Product, Variant } from "@/lib/catalog/types";

/** What the cart remembers about an item. Prices are refreshed from the server before checkout. */
export interface CartSnapshot {
  name: string;
  tint: string;
  icon: IconKey;
  image?: string | null;
  variantLabel: string;
  shipMode: "air" | "sea";
  isGadget: boolean;
  prices: PriceSet;
}

export interface CartItem {
  key: string;
  slug: string;
  variantId: string;
  qty: number;
  /** Unit price when added, to show "₦X less than when added". */
  addedPrice: number;
  selected: boolean;
  snap: CartSnapshot;
}

interface CartApi {
  items: CartItem[];
  count: number;
  add: (product: Product, variant: Variant, qty: number, unit: number) => void;
  setQty: (key: string, qty: number) => void;
  toggle: (key: string) => void;
  setAll: (selected: boolean) => void;
  remove: (key: string) => void;
  /** Update stored prices after the server has re-priced the cart. */
  refresh: (prices: { key: string; prices: PriceSet }[]) => void;
}

const CartContext = createContext<CartApi | null>(null);

export const variantLabel = (v: Variant) => Object.values(v.props).join(" / ");

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = usePersistentState<CartItem[]>("fc-cart-v2", []);

  const api = useMemo<CartApi>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    add: (product, variant, qty, unit) => {
      const key = `${product.slug}|${variant.id}`;
      setItems((prev) => {
        if (prev.some((p) => p.key === key)) return prev.map((p) => (p.key === key ? { ...p, qty: p.qty + qty } : p));
        const snap: CartSnapshot = {
          name: product.name, tint: product.tint, icon: product.icon, image: variant.image ?? product.images[0] ?? null,
          variantLabel: variantLabel(variant), shipMode: product.shipMode, isGadget: product.isGadget, prices: variant.prices,
        };
        return [...prev, { key, slug: product.slug, variantId: variant.id, qty, addedPrice: unit, selected: true, snap }];
      });
    },
    setQty: (key, qty) => setItems((prev) => prev.map((p) => (p.key === key ? { ...p, qty: Math.min(999, Math.max(1, qty)) } : p))),
    toggle: (key) => setItems((prev) => prev.map((p) => (p.key === key ? { ...p, selected: !p.selected } : p))),
    setAll: (selected) => setItems((prev) => prev.map((p) => ({ ...p, selected }))),
    remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
    refresh: (updates) =>
      setItems((prev) => prev.map((p) => {
        const u = updates.find((x) => x.key === p.key);
        return u ? { ...p, snap: { ...p.snap, prices: u.prices } } : p;
      })),
  }), [items, setItems]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
