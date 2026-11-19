"use client";

import { Check, Lock, MapPin, Share2, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { priceLines } from "../actions";
import { useCart } from "@/components/shop/cart-provider";
import { useLivePromo } from "@/components/shop/live-price";
import { ProductTile } from "@/components/shop/product-card";
import { Countdown } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { Progress } from "@/components/ui/progress";
import { useSiteData } from "@/components/shop/site-data";
import { cn, naira } from "@/lib/format";
import { productTotals, unitFromPrices } from "@/lib/pricing/prices";

const FILTERS = ["All", "Price drops", "Sea items"] as const;

export function CartView() {
  const { coupons } = useSiteData();
  const { items, setQty, toggle, setAll, remove, refresh } = useCart();
  const promo = useLivePromo();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  // Re-check prices with the server (price changes, retailer quantities). Costs never reach the browser.
  const requestKey = items.map((i) => `${i.key}:${i.qty}`).join(",");
  const lastKey = useRef("");
  useEffect(() => {
    if (!requestKey || requestKey === lastKey.current) return;
    lastKey.current = requestKey;
    priceLines(items.map((i) => ({ slug: i.slug, variantId: i.variantId, qty: i.qty })))
      .then((fresh) => refresh(fresh.map((f) => ({ key: `${f.slug}|${f.variantId}`, prices: f.prices }))))
      .catch(() => {});
  }, [requestKey, items, refresh]);

  const selected = items.filter((i) => i.selected);
  // Retailer prices count every selected variant of the same product together.
  const totals = productTotals(selected);
  const unitOf = (i: (typeof items)[number], p: "none" | "midnight" = promo) => unitFromPrices(i.snap.prices, i.qty, p, i.selected ? totals.get(i.slug) : i.qty);
  const subtotalList = selected.reduce((s, i) => s + i.snap.prices.list * i.qty, 0);
  const subtotal = selected.reduce((s, i) => s + unitOf(i) * i.qty, 0);
  const midnightTotal = selected.reduce((s, i) => s + unitOf(i, "midnight") * i.qty, 0);
  const quote = { subtotalList, subtotal, priceSavings: subtotalList - subtotal };
  const midnight = { subtotal: midnightTotal };
  const selCount = selected.reduce((n, i) => n + i.qty, 0);
  const allOn = items.length > 0 && items.every((i) => i.selected);

  // Next coupon tier, counted on items coupons can apply to.
  const eligible = selected.filter((i) => !i.snap.isGadget && (totals.get(i.slug) ?? i.qty) < 10).reduce((s, i) => s + unitOf(i) * i.qty, 0);
  const tiers = coupons.filter((c) => !c.gadgetOnly && c.amount).sort((a, b) => a.minSpend - b.minSpend);
  const next = tiers.find((c) => eligible < c.minSpend);
  const best = [...tiers].reverse().find((c) => eligible >= c.minSpend);

  const shown = items.filter((i) =>
    filter === "Price drops" ? i.addedPrice > unitOf(i) : filter === "Sea items" ? i.snap.shipMode === "sea" : true,
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <ShoppingBag aria-hidden size={48} strokeWidth={1.2} className="text-subtle" />
        <h1 className="text-lg font-extrabold">Your cart is empty</h1>
        <p className="text-muted">Fill it with ₦20,000+ before Friday 8pm and you’re in the Cart Clear-Out draw.</p>
        <Link href="/" className="bg-ink px-5 py-3 font-extrabold text-white">START SHOPPING</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 bg-surface pb-40 lg:grid lg:grid-cols-[1fr_360px] lg:items-start md:gap-6 md:bg-transparent md:pt-6 md:pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 md:px-0">
          <button type="button" onClick={() => setAll(!allOn)} aria-pressed={allOn} className="flex min-h-11 items-center gap-1.5 text-sm">
            <span className={cn("flex size-[22px] items-center justify-center rounded-full", allOn ? "bg-ink text-white" : "border-[1.5px] border-[#999]")}>
              {allOn && <Check aria-hidden size={13} strokeWidth={3} />}
            </span>
            All
          </button>
          <h1 className="text-lg font-extrabold md:text-2xl">
            Cart <span className="text-[13px]">({items.length})</span>
          </h1>
          <span className="flex items-center gap-0.5 text-xs text-muted">
            <MapPin aria-hidden size={12} /> Ikeja
          </span>
          <Link href="/checkout?pay=group" aria-label="Share cart for Group pay" className="ml-auto flex size-11 items-center justify-center">
            <Share2 aria-hidden size={20} />
          </Link>
        </div>

        <div className="flex items-center gap-2 bg-success-soft px-3 py-2.5 text-success md:rounded-md">
          <Check aria-hidden size={16} strokeWidth={3} />
          <span>
            <strong>FREE shipping</strong> to your Jumia pickup station
          </span>
        </div>

        <div className="flex gap-1.5 px-3 md:px-0">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("min-h-9 px-3.5 text-[13px]", filter === f ? "bg-ink text-white" : "bg-white md:border md:border-line")}>
              {f}
            </button>
          ))}
        </div>

        <ul className="flex flex-col bg-white md:rounded-md md:border md:border-line">
          {shown.map((i) => {
            const unit = unitOf(i);
            const drop = i.addedPrice - unit;
            const b = i.snap.prices;
            const variant = i.snap.variantLabel;
            return (
              <li key={i.key} className="flex items-start gap-2.5 border-b border-[#f2f2f2] p-3 last:border-0">
                <button type="button" onClick={() => toggle(i.key)} aria-pressed={i.selected} aria-label={i.selected ? "Deselect item" : "Select item"} className="flex h-24 w-8 items-center justify-center">
                  <span className={cn("flex size-5 items-center justify-center rounded-full", i.selected ? "bg-ink text-white" : "border-[1.5px] border-[#999]")}>
                    {i.selected && <Check aria-hidden size={12} strokeWidth={3} />}
                  </span>
                </button>
                <Link href={`/product/${i.slug}`} className="shrink-0">
                  <ProductTile tint={i.snap.tint} icon={i.snap.icon} name={i.snap.name} image={i.snap.image} sizes="96px" className="h-[104px] w-[84px] md:h-32 md:w-24" iconSize={44} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[13px]">{i.snap.name}</span>
                  <span className="text-xs text-subtle">
                    {variant && `${variant} · `}
                    {i.snap.shipMode === "sea" ? "Sea 90+ days" : "Air 10+ days"}
                  </span>
                  <div className="flex items-center justify-between">
                    <strong className="text-[17px] text-sale">{naira(unit)}</strong>
                    <span className="flex items-center border border-[#e2e2e2]">
                      <button type="button" aria-label="Decrease" onClick={() => setQty(i.key, i.qty - 1)} className="size-8">−</button>
                      <span className="min-w-6 text-center font-bold">{i.qty}</span>
                      <button type="button" aria-label="Increase" onClick={() => setQty(i.key, i.qty + 1)} className="size-8">+</button>
                    </span>
                  </div>
                  {drop > 0 && <span className="self-start bg-[#FFF1EC] px-1.5 py-0.5 text-xs font-bold text-orange">{naira(drop)} less than when added</span>}
                  <span className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-night">{promo === "midnight" ? "Midnight price applied" : `${naira(b.midnight)} at midnight`}</span>
                    <button type="button" aria-label={`Remove ${i.snap.name}`} onClick={() => remove(i.key)} className="flex size-8 items-center justify-center text-subtle">
                      <Trash2 aria-hidden size={16} />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
          {shown.length === 0 && <li className="p-6 text-center text-muted">Nothing matches this filter.</li>}
        </ul>

        <section className="flex flex-col gap-1.5 bg-white p-3 md:rounded-md md:border md:border-line">
          <span className="flex items-center justify-between font-bold">
            {next ? `Add ${naira(next.minSpend - eligible)} more to unlock ${next.label}` : best ? `${best.label} will be applied at checkout ✓` : "Coupons apply at checkout"}
            <InfoButton topic="coupons" />
          </span>
          <Progress value={next ? (eligible / next.minSpend) * 100 : 100} className="bg-[#F6D3D8]" label="Progress to next coupon" />
        </section>

        <section className="mx-3 flex flex-col gap-2 rounded-md border-[1.5px] border-success bg-white p-3 md:mx-0">
          <strong className="text-sm text-success">Important cart notice</strong>
          <span className="leading-relaxed">
            • Prices drop at midnight. These items would cost <strong>{naira(midnight.subtotal)}</strong> between 12am and 4am (in{" "}
            <Countdown target="midnight" className="bg-ink px-1 text-white" />
            ).
          </span>
          <span className="leading-relaxed">
            • {quote.subtotal >= 20_000 ? "Your cart is entered" : "Add items to enter"} in Friday’s <Link href="/deals#clearout" className="font-bold underline">Cart Clear-Out</Link>. Keep ₦20,000+ in it until 8pm Friday.
          </span>
          <span className="flex flex-wrap gap-x-4">
            <InfoButton topic="midnight" label="How Midnight Drop works" />
            <InfoButton topic="clearout" label="How Clear-Out works" />
          </span>
          <span className="border-t border-line pt-2 text-xs text-muted">Prices follow the live yuan rate and are final once you pay.</span>
        </section>

        <section className="grid grid-cols-4 gap-1 px-2 py-1.5 text-center text-[11px] text-[#444]">
          {[[ShieldCheck, "Safe payment"], [Lock, "Privacy (NDPA)"], [ShoppingBag, "Buyer protection"], [Truck, "Delivery guarantee"]].map(([Icon, label]) => {
            const I = Icon as typeof Lock;
            return (
              <span key={label as string} className="flex flex-col items-center gap-1">
                <I aria-hidden size={22} className="text-success" />
                {label as string}
              </span>
            );
          })}
        </section>
      </div>

      {/* Summary: sticky card on desktop, fixed bar on phones */}
      <aside className="fixed inset-x-0 bottom-[62px] z-20 flex items-center gap-2.5 border-t border-line bg-white px-3 py-2 md:static lg:sticky lg:top-32 md:bottom-auto md:flex-col md:items-stretch md:gap-3 md:rounded-md md:border md:p-5">
        <h2 className="hidden text-base font-extrabold md:block">Order summary</h2>
        <dl className="hidden flex-col gap-1.5 md:flex">
          <div className="flex justify-between"><dt className="text-muted">Items ({selCount})</dt><dd>{naira(quote.subtotalList)}</dd></div>
          {quote.priceSavings > 0 && <div className="flex justify-between"><dt className="text-muted">Midnight / retailer savings</dt><dd className="text-sale">−{naira(quote.priceSavings)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Shipping &amp; clearing</dt><dd className="font-bold text-success">Free</dd></div>
        </dl>
        <span className="flex flex-col md:flex-row md:items-baseline md:justify-between md:border-t md:border-line md:pt-3">
          <span className="hidden font-bold md:inline">Total</span>
          <strong className="text-lg text-sale md:text-xl">{naira(quote.subtotal)}</strong>
          <span className="text-[11px] text-muted md:hidden">{selCount} selected · shipping free</span>
        </span>
        <Link
          href="/checkout"
          aria-disabled={selCount === 0}
          className={cn("flex min-h-12 flex-1 items-center justify-center text-[15px] font-extrabold text-white", selCount ? "bg-ink" : "pointer-events-none bg-black/30")}
        >
          Checkout ({selCount})
        </Link>
      </aside>
    </div>
  );
}
