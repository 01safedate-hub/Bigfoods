"use client";

import { AlertTriangle, ChevronLeft, Minus, Plus, Ship, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductTile } from "@/components/shop/product-card";
import { naira } from "@/lib/format";
import { useWholesaleCart, type WCartLine, wcart } from "@/lib/wholesale/cart";
import { MIN_QTY, SEA_DAYS } from "@/lib/wholesale/rules";
import { quoteWholesale } from "../actions";

/** Re-checks prices with the server; lines whose price moved get the new price. */
export function useWholesaleQuote(lines: WCartLine[]) {
  const [state, setState] = useState<{ missing: number; unavailable: Set<string>; plans: number[]; total: number; checked: boolean }>({ missing: 0, unavailable: new Set(), plans: [], total: 0, checked: false });
  const key = lines.map((l) => `${l.variantId}:${l.qty}`).join(",");
  useEffect(() => {
    if (!lines.length) return;
    const t = setTimeout(async () => {
      const q = await quoteWholesale(lines.map(({ slug, variantId, qty }) => ({ slug, variantId, qty }))).catch(() => null);
      if (!q) return;
      wcart.reprice(new Map(q.lines.map((l) => [l.variantId, l.unit])));
      const ok = new Set(q.lines.map((l) => l.variantId));
      setState({ missing: q.missing, unavailable: new Set(lines.filter((l) => !ok.has(l.variantId)).map((l) => l.variantId)), plans: q.plans, total: q.total, checked: true });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export function WholesaleCart() {
  const lines = useWholesaleCart();
  const quote = useWholesaleQuote(lines);
  const groups = useMemo(() => {
    const m = new Map<string, WCartLine[]>();
    for (const l of lines) m.set(l.slug, [...(m.get(l.slug) ?? []), l]);
    return [...m.values()];
  }, [lines]);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const short = groups.filter((g) => g.reduce((s, l) => s + l.qty, 0) < MIN_QTY);

  return (
    <div className="flex w-full flex-col gap-3 pb-36 md:pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8 lg:pb-10">
      <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-line bg-white px-2 py-2 md:rounded-t-2xl md:border">
        <Link href="/wholesale" aria-label="Back to wholesale market" className="flex size-11 items-center justify-center"><ChevronLeft aria-hidden size={24} /></Link>
        <h1 className="flex-1 text-[19px] font-extrabold">Wholesale cart</h1>
        {lines.length > 0 && <button type="button" onClick={() => wcart.clear()} className="px-3 text-[13px] font-bold text-muted underline">Empty cart</button>}
      </div>

      {!lines.length ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Ship aria-hidden size={44} strokeWidth={1.2} className="text-sale" />
          <strong className="text-[16px]">Your wholesale cart is empty</strong>
          <p className="text-[14px] text-muted">Add stock from the wholesale market, or start with a starter kit.</p>
          <Link href="/wholesale" className="min-h-11 rounded-full bg-sale px-6 py-3 text-[14px] font-extrabold text-white">Go to the wholesale market</Link>
        </div>
      ) : (
        <>
          <p className="mx-3 flex items-start gap-2 rounded-xl bg-[#FFF1F2] p-3 text-[13px] text-[#7F0A15] md:mx-0">
            <Ship aria-hidden size={18} className="mt-0.5 shrink-0" />
            Ships by sea and clears customs in Lagos {SEA_DAYS[0]}–{SEA_DAYS[1]} days after full payment. Freight and clearing are in the price; delivery from Lagos to you is arranged and billed by state.
          </p>
          {quote.missing > 0 && (
            <p role="alert" className="mx-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#FFF7E0] p-3 text-[13px] text-gold-ink md:mx-0">
              {quote.missing} item{quote.missing > 1 ? "s are" : " is"} no longer in the wholesale market.
              <button type="button" onClick={() => wcart.removeVariants(quote.unavailable)} className="font-bold underline">Remove</button>
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {groups.map((g) => {
              const first = g[0];
              const n = g.reduce((s, l) => s + l.qty, 0);
              return (
                <li key={first.slug} className="flex flex-col gap-2.5 bg-white p-3 md:rounded-2xl md:border md:border-line">
                  <div className="flex items-start gap-3">
                    <Link href={`/wholesale/p/${first.slug}`} className="size-16 shrink-0 overflow-hidden rounded-lg">
                      <ProductTile tint={first.tint} icon={first.icon} name={first.name} image={first.image} className="size-full rounded-none" iconSize={28} sizes="64px" />
                    </Link>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <strong className="line-clamp-2 text-[14px] leading-snug">{first.name}</strong>
                      <span className="text-[12px] text-muted">{n} units · {naira(g.reduce((s, l) => s + l.qty * l.unit, 0))}</span>
                    </span>
                    <button type="button" aria-label={`Remove ${first.name}`} onClick={() => wcart.removeProduct(first.slug)} className="flex size-10 items-center justify-center text-muted"><Trash2 aria-hidden size={18} /></button>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {g.map((l) => (
                      <li key={l.variantId} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-[13px]">
                        <span className="min-w-0 flex-1 truncate">{l.label || "Standard"} · <span className="text-muted">{naira(l.unit)}/unit</span></span>
                        <span className="flex items-center rounded-full border border-line bg-white">
                          <button type="button" aria-label="Fewer" onClick={() => wcart.setQty(l.slug, l.variantId, l.qty - 1)} className="flex size-8 items-center justify-center"><Minus aria-hidden size={13} /></button>
                          <input aria-label={`Units of ${l.label || first.name}`} inputMode="numeric" value={l.qty} onChange={(e) => wcart.setQty(l.slug, l.variantId, Number(e.target.value.replace(/\D/g, "")) || 0)} className="w-11 text-center font-bold tabular-nums outline-none" />
                          <button type="button" aria-label="More" onClick={() => wcart.setQty(l.slug, l.variantId, l.qty + 1)} className="flex size-8 items-center justify-center"><Plus aria-hidden size={13} /></button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {n < MIN_QTY && <p className="flex items-center gap-1.5 text-[12px] font-semibold text-sale"><AlertTriangle aria-hidden size={14} /> Add {MIN_QTY - n} more to reach the {MIN_QTY}-unit minimum</p>}
                </li>
              );
            })}
          </ul>
          <Link href="/wholesale" className="mx-3 flex min-h-11 items-center justify-center rounded-full border border-ink text-[14px] font-bold md:mx-0">+ Add more products</Link>
        </>
      )}

      </div>

      {lines.length > 0 && (
        <aside aria-label="Summary" className="sticky top-28 hidden flex-col gap-3 rounded-2xl border border-line bg-white p-5 lg:flex">
          <h2 className="text-[16px] font-extrabold">Summary</h2>
          <dl className="flex flex-col gap-1.5 text-[14px]">
            <div className="flex justify-between"><dt className="text-muted">Products</dt><dd>{groups.length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Units</dt><dd>{units}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Freight &amp; clearing</dt><dd className="font-semibold text-success">Included</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery in Nigeria</dt><dd>By state, later</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-[18px] font-extrabold"><dt>Total</dt><dd className="tabular-nums">{naira(total)}</dd></div>
          </dl>
          {short.length || quote.missing ? (
            <p className="rounded-xl bg-surface p-3 text-[13px] font-semibold text-muted">{quote.missing ? "Remove unavailable items to continue." : `Reach ${MIN_QTY} units of each product to continue.`}</p>
          ) : (
            <Link href="/wholesale/checkout" className="flex min-h-12 items-center justify-center rounded-full bg-sale text-[15px] font-extrabold text-white">Checkout</Link>
          )}
        </aside>
      )}

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(49px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white px-3 py-3 md:bottom-0 lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <strong className="text-[18px] tabular-nums">{naira(total)}</strong>
              <span className="text-[12px] text-muted">{units} units · {groups.length} products · freight &amp; clearing included</span>
            </span>
            {short.length || quote.missing ? (
              <span className="rounded-full bg-surface px-4 py-3 text-[13px] font-bold text-muted">{quote.missing ? "Remove unavailable items" : `Reach ${MIN_QTY} per product`}</span>
            ) : (
              <Link href="/wholesale/checkout" className="rounded-full bg-sale px-6 py-3 text-[15px] font-extrabold text-white">Checkout</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
