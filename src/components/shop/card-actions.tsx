"use client";

import { Check, Heart, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product, Variant } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { unitFromPrices } from "@/lib/pricing/prices";
import { useCart } from "./cart-provider";
import { useLivePromo } from "./live-price";

export function WishlistButton({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
      onClick={() => setOn(!on)}
      className={cn("flex size-9 items-center justify-center rounded-full bg-white shadow-sm", className)}
    >
      <Heart aria-hidden size={16} className={on ? "fill-sale text-sale" : "text-ink"} />
    </button>
  );
}

/** Adds single-variant items straight to the cart; items with colours or sizes open the product page to choose. */
export function AddToCartIcon({ product, variant, className }: { product: Product; variant: Variant | null; className?: string }) {
  const { add } = useCart();
  const router = useRouter();
  const promo = useLivePromo();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={variant ? "Add to cart" : "Choose options"}
      onClick={() => {
        if (!variant) return router.push(`/product/${product.slug}`);
        add(product, variant, 1, unitFromPrices(variant.prices, 1, promo));
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className={cn("flex size-9 items-center justify-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(0_0_0/0.12)]", className)}
    >
      {done ? <Check aria-hidden size={16} className="text-success" /> : <ShoppingCart aria-hidden size={16} />}
    </button>
  );
}
