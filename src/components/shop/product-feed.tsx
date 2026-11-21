"use client";

import { Fragment, useState } from "react";
import { InfoButton } from "@/components/ui/info-button";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { ProductCard } from "./product-card";
import { PromoTile, SpotlightCarousel } from "./feed-promos";
import { categoryRanks } from "./spotlight-card";

const TABS = ["For You", "Gadgets", "New In", "Under ₦10k", "Sea items"] as const;
type Tab = (typeof TABS)[number];

/** Newest first: products staff marked new, then by date added. */
export function newIn(list: Product[], max = 60): Product[] {
  return [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || (b.addedAt ?? 0) - (a.addedAt ?? 0)).slice(0, max);
}

const filter = (tab: Tab, list: Product[]) => {
  switch (tab) {
    case "Gadgets": return list.filter((p) => p.isGadget);
    case "New In": return newIn(list);
    case "Under ₦10k": return list.filter((p) => p.prices.list < 10_000);
    case "Sea items": return list.filter((p) => p.shipMode === "sea");
    default: return list;
  }
};

export function ProductFeed({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<Tab>("For You");
  const list = filter(tab, products);
  // Every 8 cards, a full-photo best seller spans the row so long scrolls don't feel samey.
  const best = [...list].sort((a, b) => b.sold - a.sold).slice(0, 6);
  // Real product photos for the promo cards.
  const photos = [...list].sort((a, b) => b.sold - a.sold).flatMap((p) => p.images.slice(0, 1)).slice(0, 24);
  const ranks = categoryRanks(products);
  return (
    <section aria-label="Products" className="flex flex-col gap-2">
      <div className="no-scrollbar sticky top-[69px] z-10 flex items-center gap-0.5 overflow-x-auto bg-white px-2 md:static md:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={cn("min-h-10 whitespace-nowrap border-b-2 px-2 text-sm md:px-3 md:text-[15px]", tab === t ? "border-sale font-extrabold" : "border-transparent text-subtle")}
          >
            {t}
          </button>
        ))}
        <InfoButton topic="shipping" className="ml-auto text-muted" />
      </div>
      {list.length === 0 ? (
        <p className="px-3 py-8 text-center text-muted">Nothing here yet. New items arrive daily.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 px-1.5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:gap-y-5 md:px-0 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((p, i) => {
            const n = i + 1;
            const spotSlot = n % 8 === 0;
            const spot = spotSlot ? best[(n / 8 - 1) % Math.max(best.length, 1)] : undefined;
            return (
              <Fragment key={p.slug}>
                <ProductCard product={p} />
                {/* Every 12 cards: a small "sell with us" card, different each visit. */}
                {n % 12 === 5 && <PromoTile slot={Math.floor(n / 12)} images={photos} />}
                {/* Every 8 cards: a big swipeable card (best seller, then wholesale, then dropshipping). */}
                {spotSlot && <SpotlightCarousel product={spot} rank={spot ? ranks.get(spot.slug) : undefined} className="col-span-2 aspect-[16/11] sm:aspect-[2/1]" images={photos} />}
              </Fragment>
            );
          })}
        </div>
      )}
    </section>
  );
}
