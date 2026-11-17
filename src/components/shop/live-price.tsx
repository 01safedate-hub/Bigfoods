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

export function LivePrice({ prices, className }: { prices: PriceSet; className?: string }) {
  const promo = useLivePromo();
  return <span className={className}>{naira(promo === "midnight" ? prices.midnight : prices.list)}</span>;
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
