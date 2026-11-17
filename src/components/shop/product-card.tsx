import Image from "next/image";
import Link from "next/link";
import { ProductIcon } from "@/components/ui/product-icon";
import type { IconKey, Product } from "@/lib/catalog/types";
import { compact } from "@/lib/format";
import { AddToCartIcon, WishlistButton } from "./card-actions";
import { LivePrice } from "./live-price";

export function ShipTag({ sea, className = "" }: { sea: boolean; className?: string }) {
  return (
    <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide ${sea ? "bg-sea text-white" : "bg-white/95 text-success"} ${className}`}>
      {sea ? "SEA · 90+ DAYS" : "FREE · AIR 10+ DAYS"}
    </span>
  );
}

interface TileProps {
  tint: string;
  icon: IconKey;
  name: string;
  image?: string | null;
  badge?: string;
  className?: string;
  iconSize?: number;
  sizes?: string;
  priority?: boolean;
}

/** Product photo, or a tinted placeholder with an icon until photos are synced. */
export function ProductTile({ tint, icon, name, image, badge, className = "", iconSize = 64, sizes = "(min-width: 1024px) 220px, 50vw", priority }: TileProps) {
  const badgeClass = !badge ? "" : badge === "Gadget" ? "bg-ink text-white" : badge.startsWith("TOP") ? "bg-[#F5DE9A] text-gold-ink" : badge === "Business" ? "bg-[#7A5C17] text-white" : "bg-sale text-white";
  return (
    <span className={`relative flex items-center justify-center overflow-hidden rounded ${className}`} style={{ background: tint }}>
      {image ? <Image src={image} alt={name} fill sizes={sizes} priority={priority} className="object-cover" /> : <ProductIcon icon={icon} size={iconSize} />}
      {badge && <span className={`absolute left-0 top-0 z-[1] px-1.5 py-1 text-[10px] font-extrabold ${badgeClass}`}>{badge}</span>}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const single = product.variants.length === 1 ? product.variants[0] : null;
  return (
    <article className="relative flex min-w-0 flex-col">
      <Link href={`/product/${product.slug}`} className="flex flex-col gap-1">
        <span className="relative">
          <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={product.images[0]} badge={product.badge} className="aspect-[3/4] w-full" />
          {product.shipMode === "sea" && <ShipTag sea className="absolute bottom-1.5 left-1.5" />}
        </span>
        <span className="mt-0.5 truncate text-xs text-[#333] md:text-[13px]">{product.name}</span>
        <span className="flex items-baseline gap-1.5">
          <LivePrice prices={product.prices} className="text-[15px] font-extrabold" showWas />
        </span>
        <span className="text-[11px] text-subtle">
          {compact(product.sold)} sold · ★ {product.rating}
        </span>
      </Link>
      {/* Same shape as the photo, so the buttons sit on its corners whatever the card width. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] [&>*]:pointer-events-auto">
        <WishlistButton className="absolute right-1.5 top-1.5" />
        <AddToCartIcon product={product} variant={single} className="absolute bottom-1.5 right-1.5" />
      </div>
    </article>
  );
}
