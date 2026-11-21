"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { HandCoins, Ship } from "lucide-react";
import { AdSlide } from "./feed-promos";
import { SpotlightCard } from "./spotlight-card";

const STORE = (process.env.NEXT_PUBLIC_STORE_URL ?? "https://fastchina.store").replace(/\/$/, "");

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
        {products.flatMap((p, i) => {
          const slide = "aspect-[4/5] w-[86%] shrink-0 snap-center sm:w-[46%] lg:aspect-[4/3] lg:w-[32%]";
          const card = <SpotlightCard key={p.slug} product={p} rank={ranks[p.slug]} priority={i === 0} className={slide} />;
          // The second and fourth cards advertise the wholesale market and free dropshipping.
          if (i === 1) return [<div key="ad-w" className={cn(slide, "overflow-hidden rounded-2xl")}><AdSlide href="/wholesale" tone="from-[#F0283A] via-[#C8102E] to-[#6E0711]" kicker="WHOLESALE MARKET" title="Stock your shop at factory prices" sub="From 10 units per product, by sea. Starter kits inside." cta="Open wholesale" icon={Ship} art="ship" /></div>, card];
          if (i === 3) return [<div key="ad-d" className={cn(slide, "overflow-hidden rounded-2xl")}><AdSlide href={`${STORE}/seller`} external tone="from-[#3B82F6] via-[#1D4ED8] to-[#172554]" kicker="DROPSHIP FOR FREE" title="Sell these products. Keep your profit." sub="Your own store website for ₦0." cta="Start free" icon={HandCoins} art="seller-win" /></div>, card];
          return [card];
        })}
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden>
        {Array.from({ length: products.length + (products.length > 1 ? 1 : 0) + (products.length > 3 ? 1 : 0) }, (_, i) => (
          <span key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-ink" : "w-1.5 bg-[#d4d4d4]")} />
        ))}
      </div>
    </section>
  );
}
