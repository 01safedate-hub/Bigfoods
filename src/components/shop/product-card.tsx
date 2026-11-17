import Link from "next/link";
import { ProductIcon } from "@/components/ui/product-icon";
import { compact, naira } from "@/lib/format";
import { priceOf, shipsBySea } from "@/lib/pricing/engine";
import type { Product } from "@/lib/catalog/types";
import { AddToCartIcon, WishlistButton } from "./card-actions";
import { LivePrice, MidnightHint } from "./live-price";

export function ShipTag({ sea, className = "" }: { sea: boolean; className?: string }) {
  return (
    <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide ${sea ? "bg-sea text-white" : "bg-white/95 text-success"} ${className}`}>
      {sea ? "SEA · 90+ DAYS" : "FREE · AIR 10+ DAYS"}
    </span>
  );
}

export function ProductTile({ product, className = "", iconSize = 64 }: { product: Product; className?: string; iconSize?: number }) {
  const badge = product.badge;
  const badgeClass = !badge ? "" : badge === "Gadget" ? "bg-ink text-white" : badge.startsWith("TOP") ? "bg-[#F5DE9A] text-gold-ink" : badge === "Business" ? "bg-[#7A5C17] text-white" : "bg-sale text-white";
  return (
    <span className={`relative flex items-center justify-center overflow-hidden rounded ${className}`} style={{ background: product.tint }}>
      {badge && <span className={`absolute left-0 top-0 px-1.5 py-1 text-[10px] font-extrabold ${badgeClass}`}>{badge}</span>}
      <ProductIcon icon={product.icon} size={iconSize} />
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const b = priceOf(product);
  return (
    <article className="relative flex min-w-0 flex-col">
      <Link href={`/product/${product.slug}`} className="flex flex-col gap-1">
        <span className="relative">
          <ProductTile product={product} className="aspect-[3/4] w-full" />
          <ShipTag sea={shipsBySea(product)} className="absolute bottom-1.5 left-1.5" />
        </span>
        <span className="truncate text-xs text-[#333] md:text-[13px]">{product.name}</span>
        <span className="text-[11px] text-muted">
          {compact(product.sold)} sold · ★ {product.rating}
        </span>
        <LivePrice product={product} className="text-base font-extrabold text-sale" />
        <MidnightHint product={product} />
        <span className="text-[11px] text-muted">or {naira(Math.ceil(b.list / 4 / 100) * 100)}/wk · Pay small small</span>
      </Link>
      <WishlistButton className="absolute right-1.5 top-1.5" />
      <AddToCartIcon slug={product.slug} price={b.list} className="absolute bottom-[54px] right-0" />
    </article>
  );
}
