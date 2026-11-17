"use client";

import { useState } from "react";
import { COUPONS } from "@/lib/catalog/coupons";
import { SAMPLE_PRODUCTS as PRODUCTS } from "@/lib/catalog/sample";
import { cn, naira } from "@/lib/format";
import { NAIRA_PER_CNY, PRICING } from "@/lib/pricing/config";
import { CATEGORY_MARGIN, type PricePromo, lineFromCosts, paymentFee, priceOf, quoteCart, shipsBySea } from "@/lib/pricing/engine";

const PICKS = ["satin-cowl-neck-midi-dress", "body-wave-lace-front-wig-22", "mens-steel-quartz-watch", "amoled-android-phone-5g", "ergonomic-mesh-office-chair"];
const PROMOS: [PricePromo, string][] = [["none", "None"], ["midnight", "Midnight (20%)"], ["event", "Event (30%)"], ["flash", "Flash (50%)"]];

const RULES = [
  ["50% profit cap", "All discounts on an order together (price promo + coupon + points) never take more than 50% of its planned profit."],
  ["Price promos never add up", "Midnight, event, flash and retailer prices: the lowest single price wins."],
  ["One coupon, at most 25% of profit", "Checkout picks the best valid coupon and trims it if it would pass 25% of the eligible items’ profit."],
  ["Gadgets protected", "Phones, laptops, desktops and drones only take gadget coupons with a high minimum spend."],
  ["Retailer prices exclude coupons", "Buying 10+ already takes 40% of profit off. Nothing else stacks on top."],
  ["Points ≤ 10% of order", "And always inside the 50% cap."],
  ["Every cost counted", "List prices include Jumia last-mile and the payment fee, so free shipping is never a hidden loss."],
  ["Cart Clear-Out budget", "Fixed at 5 carts × ₦50,000 a week, and never more than 3% of last week’s profit."],
  ["Yuan rate watch", "Prices recalculate if the yuan moves more than 1.5%. Plans and group-pay orders keep their starting price."],
];

const chip = (on: boolean) => cn("min-h-9 rounded-md border px-2.5 text-xs font-semibold", on ? "border-ink bg-ink text-white" : "border-[#D0D4DB] bg-white");

export function PricingView() {
  const [slug, setSlug] = useState(PICKS[0]);
  const [promo, setPromo] = useState<PricePromo>("midnight");
  const [couponId, setCouponId] = useState<string>("save-1500");
  const [qty, setQty] = useState(1);
  const [points, setPoints] = useState(true);

  const product = PRODUCTS.find((p) => p.slug === slug)!;
  const b = priceOf(product);
  const coupon = COUPONS.find((c) => c.id === couponId) ?? null;
  const q = quoteCart([lineFromCosts(product, qty)], { promo, coupon, pointsNaira: points ? 1_240 : 0 });
  const fee = paymentFee(q.total);
  const ok = q.profitKept > 0 && q.profitKept >= 0.49 * q.plannedProfit;

  const rows: [string, number, string?][] = [
    [`Goods (¥${product.cny} × ₦${NAIRA_PER_CNY}) × ${qty}`, b.goods * qty],
    [`${shipsBySea(product) ? "Sea freight" : `Air freight (${product.weightKg} kg)`} + clearing × ${qty}`, b.logistics * qty],
    [`Jumia last-mile × ${qty}`, b.lastMile * qty],
    [`Planned profit ${product.category === "gadgets" ? "(10% + ₦50,000)" : `(${Math.round(CATEGORY_MARGIN[product.category] * 100)}% of goods)`} × ${qty}`, q.plannedProfit],
    [`List price × ${qty}`, q.subtotalList, "total"],
    ["Price promo / retailer price", -q.priceSavings],
    [`Coupon${coupon ? ` (${coupon.label})` : ""}`, -q.coupon, q.couponNote],
    ["Points", -q.points],
    ["Customer pays", q.total, "total"],
    ["Payment processor fee", -fee],
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Pricing rules &amp; promo guardrails</h1>
        <p className="text-[#5B6170]">The pricing engine and checkout both enforce these rules. No promotion, stack of promotions or staff action can sell below the profit floor.</p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-4">
        <h2 className="text-[15px] font-bold">Cost inputs</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {[
            ["Naira per US$", `₦${PRICING.nairaPerUsd.toLocaleString()}`, "Your rate"], ["Yuan per US$", `¥${PRICING.cnyPerUsd}`, "Market, 16 Nov"],
            ["Air freight", `₦${PRICING.airPerKg.toLocaleString()}/kg`, "Assumed: set yours"], ["Clearing", `₦${PRICING.clearingPerKg.toLocaleString()}/kg`, "Your figure"],
            ["Sea freight", `₦${PRICING.seaPerCbm.toLocaleString()}/CBM`, "Assumed: set yours"], ["Jumia last-mile", `₦${PRICING.lastMilePerItem.toLocaleString()}/item`, "Assumed: set yours"],
            ["Payment fee", `${PRICING.paymentFee.pct}% + ₦${PRICING.paymentFee.flat}`, `capped ₦${PRICING.paymentFee.cap.toLocaleString()}`],
          ].map(([k, v, n]) => (
            <div key={k} className="flex flex-col gap-0.5 rounded-md bg-[#F7F8FA] p-2.5">
              <dt className="text-xs text-[#5B6170]">{k}</dt>
              <dd className="text-sm font-bold">{v}</dd>
              <dd className="text-[11px] text-[#5B6170]">{n}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-md bg-[#EEF4FF] p-2.5 text-xs text-[#1D4ED8]">Standard yuan rate: <strong>₦{NAIRA_PER_CNY} per ¥1</strong>. These numbers will be editable here once the settings table is connected; the edge functions read the same values.</p>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_380px]">
        <section className="flex flex-col gap-3.5 rounded-lg border border-[#E3E5EA] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold">Promo profit check</h2>
            <span className={cn("rounded-full px-2.5 py-1.5 text-xs font-extrabold", ok ? "bg-[#ECFDF3] text-success" : "bg-[#FDECEC] text-[#B42318]")}>{ok ? "✓ Profitable · cap respected" : "✕ Below floor"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PICKS.map((s) => <button key={s} type="button" aria-pressed={slug === s} onClick={() => setSlug(s)} className={chip(slug === s)}>{PRODUCTS.find((p) => p.slug === s)!.name.split(",")[0]}</button>)}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-xs font-bold">Price promo (lowest single price wins)</legend>
              <div className="flex flex-wrap gap-1.5">{PROMOS.map(([k, l]) => <button key={k} type="button" aria-pressed={promo === k} onClick={() => setPromo(k)} className={chip(promo === k)}>{l}</button>)}</div>
            </fieldset>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-xs font-bold">Coupon (one per order)</legend>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" aria-pressed={couponId === "none"} onClick={() => setCouponId("none")} className={chip(couponId === "none")}>None</button>
                {COUPONS.map((c) => <button key={c.id} type="button" aria-pressed={couponId === c.id} onClick={() => setCouponId(c.id)} className={chip(couponId === c.id)}>{c.label}</button>)}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-xs font-bold">Quantity &amp; points</legend>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" aria-label="Fewer" onClick={() => setQty(Math.max(1, qty - 1))} className="size-9 rounded-md border border-[#D0D4DB] bg-white">−</button>
                <strong className="min-w-7 text-center">{qty}</strong>
                <button type="button" aria-label="More" onClick={() => setQty(qty + 1)} className="size-9 rounded-md border border-[#D0D4DB] bg-white">+</button>
                <button type="button" aria-pressed={points} onClick={() => setPoints(!points)} className={chip(points)}>{points ? "Points: on" : "Points: off"}</button>
              </div>
            </fieldset>
          </div>
          <dl className="overflow-hidden rounded-lg border border-[#EEF0F3]">
            {rows.map(([label, value, note]) => {
              const total = note === "total";
              return (
                <div key={label} className={cn("flex items-center gap-3 border-t border-[#F1F2F4] px-3 py-2 first:border-0", total && "bg-[#F7F8FA]")}>
                  <dt className="min-w-0 flex-1">
                    {label}
                    {note && !total && <span className="block text-[11px] text-[#8A5300]">{note}</span>}
                  </dt>
                  <dd className={cn("tabular-nums", total ? "font-extrabold" : value < 0 ? "text-[#B42318]" : "")}>{naira(value)}</dd>
                </div>
              );
            })}
            {q.refused > 0 && (
              <div className="flex items-center gap-3 border-t border-[#F1F2F4] px-3 py-2 text-[#1D4ED8]">
                <dt className="flex-1">Discount refused by guardrail<span className="block text-[11px]">The customer sees the lower discount. We never sell at a loss.</span></dt>
                <dd className="tabular-nums">{naira(q.refused)}</dd>
              </div>
            )}
          </dl>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md bg-[#F7F8FA] p-2.5"><span className="text-[11px] text-[#5B6170]">Profit kept</span><strong className={cn("block text-lg", ok ? "text-success" : "text-[#B42318]")}>{naira(q.profitKept)}</strong><span className="text-[11px] text-[#5B6170]">{Math.round((q.profitKept / q.plannedProfit) * 100)}% of planned profit</span></div>
            <div className="rounded-md bg-[#F7F8FA] p-2.5"><span className="text-[11px] text-[#5B6170]">Net margin on sale</span><strong className="block text-lg">{Math.round((q.profitKept / q.total) * 100)}%</strong><span className="text-[11px] text-[#5B6170]">after payment fee</span></div>
            <div className="rounded-md bg-[#F7F8FA] p-2.5"><span className="text-[11px] text-[#5B6170]">Dropship seller cost</span><strong className="block text-lg">{naira(b.retailer)}</strong><span className="text-[11px] text-[#5B6170]">= retailer price, per piece</span></div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2.5 rounded-lg border border-[#E3E5EA] bg-white p-4">
            <h2 className="text-[15px] font-bold">Guardrails</h2>
            {RULES.map(([t, d]) => (
              <div key={t} className="flex items-start gap-2.5 border-b border-[#F1F2F4] pb-2 last:border-0">
                <span className="rounded bg-[#ECFDF3] px-1.5 py-0.5 text-[10px] font-extrabold text-success">ON</span>
                <span className="leading-snug"><strong className="block">{t}</strong><span className="text-[#5B6170]">{d}</span></span>
              </div>
            ))}
          </section>
          <section className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-white p-4">
            <h2 className="mb-1 text-[15px] font-bold">Profit by category</h2>
            {Object.entries(CATEGORY_MARGIN).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-[#F1F2F4] py-1.5 capitalize last:border-0">
                <span>{k}{k === "furniture" || k === "machines" ? " (sea only)" : ""}</span>
                <strong>{k === "gadgets" ? "10% + ₦50,000" : `${Math.round(v * 100)}%`}</strong>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
