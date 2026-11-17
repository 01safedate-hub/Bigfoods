import type { PriceSet } from "@/lib/catalog/types";
import { PRICING } from "./config";
import { paymentFee } from "./engine";

/**
 * Profit guard. For every variant it works out the lowest amount we could ever
 * collect (deepest promotion, then coupons and points up to the guardrails), takes
 * off the payment fee, and checks what's left against cost.
 *
 * It also stress-tests a 10% rise in cost, because Pay small small locks the price
 * for up to 12 weeks while the naira can move before we buy.
 *
 *   safe    – profit even under stress
 *   watch   – profitable today, but a 10% cost rise would eat the minimum margin
 *   pause   – discounts could lose money: sell this variant at list price only (no promos, coupons or points)
 *   block   – even at list price it can't make the minimum margin: stop selling until repriced
 */
export const GUARD = { costStress: 0.1, minMarginOfCost: 0.05 };

export type GuardVerdict = "safe" | "watch" | "pause" | "block";

export interface AuditInput {
  prices: PriceSet;
  cost: number;
  plannedProfit: number;
}

export interface AuditResult {
  floor: number;
  margin: number;
  stressedMargin: number;
  verdict: GuardVerdict;
}

/** Lowest collectable amount: total discounts on a line never exceed maxDiscountShare of planned profit, unless the promo price itself is lower. */
export function floorPrice({ prices, plannedProfit }: AuditInput, promosOn = true): number {
  if (!promosOn) return prices.list; // a paused variant takes no promotions, coupons or points
  const guarded = prices.list - PRICING.guardrails.maxDiscountShareOfProfit * plannedProfit;
  const promo = Math.min(prices.midnight, prices.event, prices.flash, prices.retailer);
  return Math.floor(Math.min(promo, guarded));
}

export function auditVariant(v: AuditInput): AuditResult {
  const need = GUARD.minMarginOfCost * v.cost;
  const at = (floor: number, cost: number) => floor - paymentFee(floor) - cost;
  const floor = floorPrice(v);
  const margin = at(floor, v.cost);
  const stressedMargin = at(floor, v.cost * (1 + GUARD.costStress));
  if (stressedMargin >= need) return { floor, margin, stressedMargin, verdict: "safe" };
  if (margin >= need) return { floor, margin, stressedMargin, verdict: "watch" };
  const listFloor = floorPrice(v, false);
  return { floor, margin, stressedMargin, verdict: at(listFloor, v.cost) >= need ? "pause" : "block" };
}

/** Prices a shopper sees for a variant whose promotions are paused: everything falls back to the list price. */
export const pausedPrices = (p: PriceSet): PriceSet => ({ list: p.list, midnight: p.list, event: p.list, flash: p.list, retailer: p.list });
