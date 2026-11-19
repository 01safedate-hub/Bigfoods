"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { SpotlightCard } from "./spotlight-card";

/** Swipeable full-photo cards of the best sellers, with dots. */
export function BestSellers({ products, ranks }: { products: Product[]; ranks: Record<string, number> }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setActive(Math.round(el.scrollLeft / (el.firstElementChild as HTMLElement | null)!.offsetWidth || 0));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  if (!products.length) return null;
  return (
    <section aria-labelledby="best-h" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between px-3 md:px-0">
        <h2 id="best-h" className="text-[16px] font-extrabold md:text-lg">Best sellers</h2>
        <span className="text-[12px] text-muted">Most bought this week</span>
      </div>
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-3 md:px-0">
        {products.map((p, i) => (
          <SpotlightCard key={p.slug} product={p} rank={ranks[p.slug]} priority={i === 0} className="aspect-[4/5] w-[86%] shrink-0 snap-center sm:w-[46%] lg:aspect-[4/3] lg:w-[32%]" />
        ))}
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden>
        {products.map((p, i) => (
          <span key={p.slug} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-ink" : "w-1.5 bg-[#d4d4d4]")} />
        ))}
      </div>
    </section>
  );
}
