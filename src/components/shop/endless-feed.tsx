"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { PromoTile, SpotlightCarousel } from "./feed-promos";
import { ProductCard } from "./product-card";

const PAGE = 12;
const MAX = 240;

/** Keeps showing products as you scroll (related first), with the occasional promo, like a shopping app. */
export function EndlessFeed({ products, title = "You may also like" }: { products: Product[]; title?: string }) {
  const [count, setCount] = useState(PAGE);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = end.current;
    if (!el || !products.length) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && setCount((c) => Math.min(MAX, c + PAGE)), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [products.length]);
  if (!products.length) return null;
  const best = [...products].sort((a, b) => b.sold - a.sold);
  const photos = best.flatMap((p) => p.images.slice(0, 1)).slice(0, 24);
  return (
    <section aria-label={title} className="flex flex-col gap-2.5 px-1.5 pt-4 pb-24 md:px-0 md:pb-6">
      <h2 className="px-1.5 text-[15px] font-extrabold md:px-0 md:text-lg">{title}</h2>
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: count }, (_, i) => {
          const p = products[i % products.length];
          const n = i + 1;
          return (
            <Fragment key={`${p.slug}-${i}`}>
              <ProductCard product={p} />
              {n % 12 === 7 && <PromoTile slot={Math.floor(n / 12) + 3} images={photos} />}
              {n % 16 === 0 && <SpotlightCarousel product={best[(n / 16) % best.length]} className="col-span-2 aspect-[16/11] sm:aspect-[2/1]" images={photos} />}
            </Fragment>
          );
        })}
      </div>
      <div ref={end} aria-hidden className="h-px" />
      {count >= MAX && <p className="text-center text-[13px] text-muted">You’ve seen it all for now. Try search for something specific.</p>}
    </section>
  );
}
