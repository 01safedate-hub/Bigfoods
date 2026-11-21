import Link from "next/link";
import { ProductIcon } from "@/components/ui/product-icon";
import { SafeImage } from "@/components/ui/safe-image";
import type { IconKey, Product } from "@/lib/catalog/types";
import { compact } from "@/lib/format";
import { AddToCartIcon, WishlistButton } from "./card-actions";
import { LivePrice } from "./live-price";

export function ShipTag({ sea, className = "" }: { sea: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-semibold leading-none backdrop-blur-sm ${sea ? "bg-sea/90 text-white" : "bg-white/90 text-success"} ${className}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${sea ? "bg-gold" : "bg-success"}`} />
      {sea ? "Sea · 90+ days" : "Free shipping"}
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
      {image ? (
        <SafeImage src={image} alt={name} fill sizes={sizes} priority={priority} className="object-cover" fallback={<ProductIcon icon={icon} size={iconSize} />} />
      ) : (
        <ProductIcon icon={icon} size={iconSize} />
      )}
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
          <ShipTag sea={product.shipMode === "sea"} className="absolute bottom-2 left-1.5" />
        </span>
        <span className="mt-0.5 truncate text-xs text-[#333] md:text-[13px]">
          {product.customisable && <span className="mr-1 rounded-sm bg-[#FFF1D6] px-1 py-px text-[9px] font-extrabold text-[#8A5A00]">CUSTOM</span>}
          {product.name}
        </span>
        <span className="flex items-baseline gap-1.5">
          <LivePrice prices={product.prices} className="text-[15px] font-extrabold" showWas />
        </span>
        <span className="text-[11px] text-subtle">
          {compact(product.sold)} sold · ★ {product.rating}
        </span>
      </Link>
      {/* Same shape as the photo, so the buttons sit on its corners whatever the card width. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] [&>*]:pointer-events-auto">
        <WishlistButton slug={product.slug} className="absolute right-1.5 top-1.5" />
        <AddToCartIcon product={product} variant={single} className="absolute bottom-1.5 right-1.5" />
      </div>
    </article>
  );
}
