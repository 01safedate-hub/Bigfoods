"use client";

import { Moon, Zap } from "lucide-react";
import Link from "next/link";
import { Countdown, MidnightLabel } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { Progress } from "@/components/ui/progress";
import { usePersistentState } from "@/hooks/use-persistent-state";
import type { Product } from "@/lib/catalog/types";
import { cn, naira } from "@/lib/format";
import { ProductTile } from "./product-card";
import { useSiteData } from "./site-data";

export function MidnightStrip() {
  return (
    <div className="flex items-center bg-night pr-1 text-white">
      <Link href="/deals" className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-xs md:justify-center md:text-[13px]">
        <Moon aria-hidden size={14} strokeWidth={2.2} className="shrink-0 text-night-soft" />
        <span className="truncate font-semibold">
          <MidnightLabel live="Midnight Drop is LIVE · 20% off our margin · ends in" idle="Every price drops at midnight · starts in" />
        </span>
        <Countdown target="midnight" className="rounded bg-white/15 px-1.5 py-0.5 font-extrabold" />
      </Link>
      <InfoButton topic="midnight" />
    </div>
  );
}

export function useClaimed() {
  return usePersistentState<string[]>("fc-claimed-coupons", []);
}

export function CouponRow({ compact = false }: { compact?: boolean }) {
  const [claimed, setClaimed] = useClaimed();
  const { coupons } = useSiteData();
  const list = compact ? coupons.filter((c) => !c.gadgetOnly) : coupons;
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", !compact && "flex-col overflow-visible")}>
      {list.map((c) => {
        const got = claimed.includes(c.id);
        const copy = c;
        return compact ? (
          <div key={c.id} className="flex w-[150px] shrink-0 flex-col overflow-hidden rounded-md border border-[#F6C9CF] bg-sale-soft md:w-auto md:flex-1">
            <span className="flex flex-col gap-0.5 p-2.5 pb-1.5">
              <strong className="text-lg text-sale">{c.label.replace(" gadgets", "")}</strong>
              <span className="text-[11px] text-[#5A1520]">{copy.rule}</span>
            </span>
            <button
              type="button"
              onClick={() => !got && setClaimed([...claimed, c.id])}
              className={cn("min-h-9 border-t border-dashed border-[#F0A9B3] text-xs font-extrabold", got ? "text-sale" : "bg-sale text-white")}
            >
              {got ? "CLAIMED ✓" : "CLAIM"}
            </button>
          </div>
        ) : (
          <div key={c.id} className="flex overflow-hidden rounded-md border border-[#F6C9CF] bg-sale-soft">
            <span className="flex w-[104px] shrink-0 flex-col items-center justify-center border-r border-dashed border-[#F0A9B3] p-2.5 text-center">
              <strong className="text-lg leading-tight text-sale">{c.label.replace(" gadgets", "")}</strong>
              <span className="text-[10px] text-[#5A1520]">{c.minSpend ? `min ${naira(c.minSpend)}` : `max ${naira(c.max ?? 0)}`}</span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-2.5">
              <strong className="text-[13px]">{copy.title}</strong>
              <span className="text-xs text-[#5A1520]">{copy.rule}</span>
            </span>
            <button type="button" onClick={() => !got && setClaimed([...claimed, c.id])} className={cn("w-[76px] shrink-0 text-xs font-extrabold", got ? "text-sale" : "bg-sale text-white")}>
              {got ? "Claimed" : "Claim"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function FlashSale({ products }: { products: Product[] }) {
  return (
    <section aria-label="Flash sale" className="flex flex-col gap-2 rounded-md bg-sale-soft p-2.5 md:p-4">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[15px] font-extrabold italic text-sale md:text-lg">
          <Zap aria-hidden size={16} className="fill-sale" />
          FLASH SALE
        </span>
        <InfoButton topic="flash" className="text-sale" />
        <span className="hidden text-xs text-muted sm:inline">Ends in</span>
        <Countdown target="flash" className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-extrabold text-white md:text-xs" />
        <Link href="/deals" className="ml-auto text-xs text-muted">
          More ›
        </Link>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto md:grid md:grid-cols-6 md:gap-3 md:overflow-visible">
        {products.map((p) => {
          const b = p.prices;
          const off = Math.round((1 - b.flash / b.list) * 100);
          const pct = p.flash?.claimedPct ?? 50;
          return (
            <Link key={p.slug} href={`/product/${p.slug}`} className="flex w-24 shrink-0 flex-col gap-1 md:w-auto">
              <span className="relative">
                <ProductTile tint={p.tint} icon={p.icon} name={p.name} image={p.images[0]} className="h-24 w-full md:h-36" iconSize={40} sizes="160px" />
                <span className="absolute left-0 top-0 bg-sale px-1 py-0.5 text-[10px] font-extrabold text-white">-{off}%</span>
              </span>
              <strong className="text-[13px] text-sale md:text-[15px]">{naira(b.flash)}</strong>
              <Progress value={pct} className="h-1 bg-[#F6D3D8]" label={`${pct}% claimed`} />
              <span className="text-[10px] text-muted">{pct >= 85 ? "Almost gone" : `${pct}% claimed`}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ClearOutTile() {
  return (
    <div className="relative flex">
      <Link href="/deals#clearout" className="flex flex-1 flex-col gap-1 rounded-md bg-ink p-3 pr-8 text-white md:p-4">
        <span className="text-[10px] font-extrabold tracking-[0.12em] text-gold">CART CLEAR-OUT</span>
        <strong className="text-sm leading-tight md:text-base">We pay for random carts every Friday</strong>
        <span className="text-[11px] text-[#ccc]">
          Draw in <Countdown target="draw" />
        </span>
      </Link>
      <InfoButton topic="clearout" className="absolute right-0.5 top-0.5 text-white" />
    </div>
  );
}

export function RetailerTile() {
  return (
    <div className="relative flex">
      <Link href="/categories?c=retailer" className="flex flex-1 flex-col gap-1 rounded-md bg-gold-soft p-3 pr-8 md:p-4">
        <span className="text-[10px] font-extrabold tracking-[0.12em] text-[#7A5C17]">RETAILER HUB</span>
        <strong className="text-sm leading-tight md:text-base">Buy 10+, get retailer prices</strong>
        <span className="text-[11px] text-gold-ink">Up to 40% off our margin</span>
      </Link>
      <InfoButton topic="retailer" className="absolute right-0.5 top-0.5 text-gold-ink" />
    </div>
  );
}
