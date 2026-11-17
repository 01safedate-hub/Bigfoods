"use client";

import { Moon } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { naira } from "@/lib/format";
import { priceOf, type Costable } from "@/lib/pricing/engine";
import { midnightDrop } from "@/lib/time";

/** Current price (switches to the Midnight Drop price between 12am and 4am Lagos time). */
export function useLivePromo() {
  const now = useNow(30_000);
  return now !== null && midnightDrop(now).live ? ("midnight" as const) : ("none" as const);
}

export function LivePrice({ product, className }: { product: Costable; className?: string }) {
  const promo = useLivePromo();
  const b = priceOf(product);
  return <span className={className}>{naira(promo === "midnight" ? b.midnight : b.list)}</span>;
}

export function MidnightHint({ product }: { product: Costable }) {
  const promo = useLivePromo();
  const b = priceOf(product);
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-night">
      <Moon aria-hidden size={11} strokeWidth={2.4} />
      {promo === "midnight" ? "Midnight price · ends 4am" : `${naira(b.midnight)} after midnight`}
    </span>
  );
}
