import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { ProductIcon } from "@/components/ui/product-icon";
import { SafeImage } from "@/components/ui/safe-image";
import type { Product } from "@/lib/catalog/types";
import { CATEGORY_PAGES } from "@/lib/content/category-pages";
import { cn, naira } from "@/lib/format";

/** Rank of each product among its category's best sellers (1 = most sold). */
export function categoryRanks(products: Product[]): Map<string, number> {
  const ranks = new Map<string, number>();
  const by = new Map<string, Product[]>();
  for (const p of products) by.set(p.category, [...(by.get(p.category) ?? []), p]);
  for (const list of by.values()) [...list].sort((a, b) => b.sold - a.sold).forEach((p, i) => ranks.set(p.slug, i + 1));
  return ranks;
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));

/** A full-photo card: the product fills the card, with the name and price over a soft shade. */
export function SpotlightCard({ product, rank, className, priority }: { product: Product; rank?: number; className?: string; priority?: boolean }) {
  const cat = CATEGORY_PAGES[product.category]?.name ?? "";
  const off = product.prices.list > product.prices.midnight ? Math.round((1 - product.prices.midnight / product.prices.list) * 100) : 0;
  return (
    <Link href={`/product/${product.slug}`} className={cn("group relative isolate flex overflow-hidden rounded-2xl text-white", className)} style={{ background: product.tint }}>
      {product.images[0] ? (
        <SafeImage src={product.images[0]} alt="" fill sizes="(min-width: 1024px) 480px, 92vw" priority={priority} className="-z-10 object-cover transition-transform duration-500 group-hover:scale-[1.03]" fallback={<span className="absolute inset-0 -z-10 flex items-center justify-center"><ProductIcon icon={product.icon} size={120} className="text-ink/30" /></span>} />
      ) : (
        <span aria-hidden className="absolute inset-0 -z-10 flex items-center justify-center pb-16"><ProductIcon icon={product.icon} size={120} className="text-ink/25" /></span>
      )}
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-sale px-2.5 py-1 text-[12px] font-extrabold">
        <Flame aria-hidden size={13} /> BEST SELLER
      </span>
      <span className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
        <span className="rounded-full bg-ink/90 px-3 py-1.5 text-[15px] font-extrabold tabular-nums">{naira(product.prices.list)}</span>
        {off > 0 && <span className="rounded-full bg-gradient-to-r from-[#F6E7B0] to-[#E2C26B] px-2.5 py-1 text-[11px] font-extrabold text-gold-ink">−{off}% AT MIDNIGHT</span>}
      </span>
      <span className="mt-auto flex w-full flex-col gap-1 p-4">
        {rank !== undefined && cat && <span className="text-[12px] font-bold text-[#FFD9A8]">#{rank} best seller in {cat} · {compact(product.sold)} sold</span>}
        <strong className="line-clamp-2 text-[19px] font-extrabold leading-tight drop-shadow md:text-[22px]">{product.name}</strong>
        <span className="flex items-center gap-1 text-[13px] font-semibold text-white/90">View details <ArrowRight aria-hidden size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
      </span>
    </Link>
  );
}
