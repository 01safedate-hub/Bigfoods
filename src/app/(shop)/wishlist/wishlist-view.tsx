"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { useWishlist } from "@/components/shop/wishlist-provider";
import type { Product } from "@/lib/catalog/types";

export function WishlistView({ products }: { products: Product[] }) {
  const { slugs } = useWishlist();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const saved = slugs.flatMap((s) => bySlug.get(s) ?? []);
  return (
    <div className="flex flex-col gap-3 px-1.5 py-4 md:px-0">
      <h1 className="flex items-center gap-2 px-1.5 text-xl font-extrabold md:px-0"><Heart aria-hidden size={20} /> Saved items <span className="text-sm font-normal text-muted">{saved.length}</span></h1>
      {saved.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted">Tap the heart on anything you like. Sign in and your saved items follow you to every device.</p>
          <Link href="/" className="min-h-11 rounded-md bg-ink px-5 py-3 text-sm font-extrabold text-white">START SHOPPING</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 lg:grid-cols-6">
          {saved.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      )}
    </div>
  );
}
