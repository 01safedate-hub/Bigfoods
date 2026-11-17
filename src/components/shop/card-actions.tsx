"use client";

import { Check, Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/format";
import { useCart } from "./cart-provider";

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

export function AddToCartIcon({ slug, price, className }: { slug: string; price: number; className?: string }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Add to cart"
      onClick={() => {
        add({ slug, qty: 1, addedPrice: price });
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className={cn("flex h-8 w-10 items-center justify-center rounded border border-black/15 bg-white", className)}
    >
      {done ? <Check aria-hidden size={16} className="text-success" /> : <ShoppingCart aria-hidden size={16} />}
    </button>
  );
}
