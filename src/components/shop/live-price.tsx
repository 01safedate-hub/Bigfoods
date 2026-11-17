"use client";

import { Moon } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import type { PriceSet } from "@/lib/catalog/types";
import { naira } from "@/lib/format";
import { midnightDrop } from "@/lib/time";

/** "midnight" between 12am and 4am Lagos time, otherwise "none". */
export function useLivePromo() {
  const now = useNow(30_000);
  return now !== null && midnightDrop(now).live ? ("midnight" as const) : ("none" as const);
}

export function LivePrice({ prices, className, showWas }: { prices: PriceSet; className?: string; showWas?: boolean }) {
  const promo = useLivePromo();
  const live = promo === "midnight" && prices.midnight < prices.list;
  return (
    <>
      <span className={className} style={live ? { color: "var(--color-night)" } : undefined}>
        {live && <Moon aria-label="Midnight Drop price" size={12} strokeWidth={2.6} className="mr-0.5 inline -translate-y-px" />}
        {naira(live ? prices.midnight : prices.list)}
      </span>
      {showWas && live && <s className="text-[11px] text-subtle">{naira(prices.list)}</s>}
    </>
  );
}

export function MidnightHint({ prices }: { prices: PriceSet }) {
  const promo = useLivePromo();
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-night">
      <Moon aria-hidden size={11} strokeWidth={2.4} />
      {promo === "midnight" ? "Midnight price · ends 4am" : `${naira(prices.midnight)} after midnight`}
    </span>
  );
}
