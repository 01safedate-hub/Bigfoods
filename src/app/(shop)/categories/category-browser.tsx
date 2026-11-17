"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { InfoButton } from "@/components/ui/info-button";
import { ProductIcon } from "@/components/ui/product-icon";
import { CATEGORIES } from "@/lib/catalog/categories";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";

const NOTE_TONE = { sea: "bg-[#EEF4FF] text-sea", retail: "bg-[#FBF6EA] text-gold-ink", plain: "bg-surface text-[#333]" } as const;

export function CategoryBrowser({ products: all }: { products: Product[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("c") ?? "for-you";
  const cat = CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];
  const products = all.filter((p) =>
    cat.slug === "for-you" ? true : cat.slug === "women" ? ["fashion", "bags"].includes(p.category) : cat.slug === "men" ? ["fashion", "jewellery", "shoes"].includes(p.category) : cat.slug === "retailer" ? !["gadgets", "furniture", "machines"].includes(p.category) : p.category === cat.slug,
  );

  return (
    <div className="flex min-h-[calc(100dvh-140px)] md:min-h-0 md:gap-6 md:pt-6">
      <nav aria-label="Categories" className="no-scrollbar w-[116px] shrink-0 overflow-y-auto bg-surface md:w-56 md:rounded-md">
        {CATEGORIES.map((c) => {
          const on = c.slug === cat.slug;
          return (
            <button
              key={c.slug}
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => router.replace(`/categories?c=${c.slug}`, { scroll: false })}
              className={cn("block min-h-12 w-full border-l-[3px] px-2.5 py-3.5 text-left text-[13px] leading-tight md:text-sm", on ? "border-ink bg-white font-extrabold" : "border-transparent text-[#444]")}
            >
              {c.name}
            </button>
          );
        })}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 px-2.5 pt-3 pb-6 md:px-0 md:pt-0">
        {cat.note && (
          <p className={cn("flex items-start gap-1 rounded-md p-2.5 text-xs leading-relaxed", NOTE_TONE[cat.note.tone])}>
            <span className="flex-1">{cat.note.text}</span>
            <InfoButton topic={cat.note.tone === "retail" ? "retailer" : "shipping"} className="-my-1.5" />
          </p>
        )}
        <h1 className="text-[15px] font-semibold md:text-xl md:font-extrabold">{cat.slug === "for-you" ? "Picks for you" : cat.name}</h1>
        <div className="grid grid-cols-3 gap-x-2 gap-y-3.5 sm:grid-cols-4 md:grid-cols-6">
          {cat.tiles.map((t) => (
            <Link key={t.name} href={`/search?q=${encodeURIComponent(t.name)}`} className="flex flex-col items-center gap-1.5 text-center">
              <span className="flex size-[76px] items-center justify-center rounded-[22px] md:size-24" style={{ background: t.tint }}>
                <ProductIcon icon={t.icon} size={34} className="text-ink/65" />
              </span>
              <span className="text-xs leading-tight font-bold">{t.name}</span>
            </Link>
          ))}
        </div>
        {products.length > 0 && (
          <>
            <h2 className="mt-2 text-sm font-extrabold md:text-base">Popular in {cat.slug === "for-you" ? "FastChina" : cat.name}</h2>
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.slice(0, 10).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
