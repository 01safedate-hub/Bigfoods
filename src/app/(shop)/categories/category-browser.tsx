"use client";

import { inDepartment } from "@/lib/catalog/audience";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { imagesFor } from "@/lib/catalog/thumbs";
import { RotatingPhoto } from "@/components/shop/rotating-photo";
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
  const panel = useRef<HTMLDivElement>(null);
  // A new category starts at the top of its panel.
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [slug]);
  const cat = CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];
  const products = all.filter((p) =>
    cat.slug === "for-you" ? true : cat.slug === "women" ? inDepartment(p, "women") : cat.slug === "men" ? inDepartment(p, "men") : cat.slug === "retailer" ? p.wholesale : p.category === cat.slug,
  );

  // Each tile shows real photos of products that match it (else the category's best sellers).
  const tilePhotos = useMemo(
    () => cat.tiles.map((t) => {
      const hit = imagesFor(products, { name: t.name }, 4);
      return hit.length || cat.slug === "for-you" ? hit : imagesFor(products, {}, 4);
    }),
    [cat, products],
  );

  return (
    // Phones: the category list and the panel scroll on their own, between the header and the tab bar.
    <div data-app-panel className="flex h-[calc(100dvh-41px-49px-env(safe-area-inset-bottom))] overflow-hidden md:h-auto md:gap-6 md:overflow-visible md:pt-6">
      <nav aria-label="Categories" className="no-scrollbar w-[116px] shrink-0 overflow-y-auto overscroll-contain bg-surface md:w-56 md:overflow-visible md:rounded-md">
        {CATEGORIES.map((c) => {
          const on = c.slug === cat.slug;
          return (
            <button
              key={c.slug}
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => (c.slug === "retailer" ? router.push("/wholesale") : router.replace(`/categories?c=${c.slug}`, { scroll: false }))}
              className={cn("block min-h-12 w-full border-l-[3px] px-2.5 py-3.5 text-left text-[13px] leading-tight md:text-sm", on ? "border-ink bg-white font-extrabold" : c.slug === "retailer" ? "border-transparent font-extrabold text-sale" : "border-transparent text-[#444]")}
            >
              {c.name}
            </button>
          );
        })}
      </nav>
      <div ref={panel} className="flex min-w-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain px-2.5 pt-3 pb-6 md:overflow-visible md:px-0 md:pt-0">
        {cat.note && (
          <p className={cn("flex items-start gap-1 rounded-md p-2.5 text-xs leading-relaxed", NOTE_TONE[cat.note.tone])}>
            <span className="flex-1">{cat.note.text}</span>
            <InfoButton topic={cat.note.tone === "retail" ? "retailer" : "shipping"} className="-my-1.5" />
          </p>
        )}
        <h1 className="text-[15px] font-semibold md:text-xl md:font-extrabold">{cat.slug === "for-you" ? "Picks for you" : cat.name}</h1>
        <div className="grid grid-cols-3 gap-x-2 gap-y-3.5 sm:grid-cols-4 md:grid-cols-6">
          {cat.tiles.map((t, i) => (
            <Link key={t.name} href={`/search?q=${encodeURIComponent(t.name)}`} className="flex flex-col items-center gap-1.5 text-center">
              <span className="flex size-[76px] items-center justify-center overflow-hidden rounded-[22px] md:size-24" style={{ background: t.tint }}>
                <RotatingPhoto images={tilePhotos[i] ?? []} offset={i} every={6000} sizes="96px" className="size-full" fallback={<ProductIcon icon={t.icon} size={34} className="text-ink/65" />} />
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
