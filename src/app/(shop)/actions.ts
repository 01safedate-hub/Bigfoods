"use server";

import { COUPONS } from "@/lib/catalog/coupons";
import type { PriceSet } from "@/lib/catalog/types";
import { getQuoteLines, type LineRequest } from "@/lib/data/catalog";
import { quoteCart } from "@/lib/pricing/engine";
import { unitFromPrices } from "@/lib/pricing/prices";
import { midnightDrop } from "@/lib/time";

/** Demo balance until accounts are connected. */
const DEMO_POINTS = 1240;
const MAX_LINES = 100;

function clean(items: unknown): LineRequest[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LINES).flatMap((i) => {
    const slug = typeof i?.slug === "string" ? i.slug.slice(0, 200) : "";
    const variantId = typeof i?.variantId === "string" ? i.variantId.slice(0, 200) : "";
    const qty = Number.isInteger(i?.qty) ? Math.min(999, Math.max(1, i.qty)) : 0;
    return slug && variantId && qty ? [{ slug, variantId, qty }] : [];
  });
}

const activePromo = () => (midnightDrop(Date.now()).live ? ("midnight" as const) : ("none" as const));

export interface PricedLine extends LineRequest {
  unit: number;
  prices: PriceSet;
}

/** Current selling prices for cart lines (handles price drops, Midnight Drop and 10+ retailer prices). */
export async function priceLines(items: LineRequest[]): Promise<PricedLine[]> {
  const promo = activePromo();
  const lines = await getQuoteLines(clean(items));
  return lines.map((l) => ({ slug: l.slug, variantId: l.variantId, qty: l.qty, prices: l.prices, unit: unitFromPrices(l.prices, l.qty, promo) }));
}

export interface CheckoutQuote {
  promo: "none" | "midnight";
  lines: PricedLine[];
  missing: number;
  subtotalList: number;
  subtotal: number;
  priceSavings: number;
  couponLabel: string | null;
  coupon: number;
  couponNote?: string;
  points: number;
  total: number;
}

/**
 * The checkout total. Runs on the server with costs the browser never sees, applies the best valid
 * coupon and enforces every guardrail. Returns selling amounts only (no costs or profit).
 */
export async function quoteCheckout(items: LineRequest[], opts: { claimedCouponIds?: string[]; usePoints?: boolean } = {}): Promise<CheckoutQuote> {
  const promo = activePromo();
  const requested = clean(items);
  const lines = await getQuoteLines(requested);
  const claimed = Array.isArray(opts.claimedCouponIds) ? opts.claimedCouponIds.filter((x) => typeof x === "string") : [];
  const pool = COUPONS.filter((c) => claimed.length === 0 || claimed.includes(c.id));

  let best: (typeof COUPONS)[number] | null = null;
  let bestValue = 0;
  for (const c of pool) {
    const v = quoteCart(lines, { promo, coupon: c }).coupon;
    if (v > bestValue) [best, bestValue] = [c, v];
  }
  const q = quoteCart(lines, { promo, coupon: best, pointsNaira: opts.usePoints ? DEMO_POINTS : 0 });

  return {
    promo,
    lines: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, qty: l.qty, prices: l.prices, unit: unitFromPrices(l.prices, l.qty, promo) })),
    missing: requested.length - lines.length,
    subtotalList: q.subtotalList,
    subtotal: q.subtotal,
    priceSavings: q.priceSavings,
    couponLabel: best?.label ?? null,
    coupon: q.coupon,
    couponNote: q.couponNote,
    points: q.points,
    total: q.total,
  };
}
