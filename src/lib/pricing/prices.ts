import type { PriceSet } from "@/lib/catalog/types";
import { PRICING } from "./config";
import type { PricePromo } from "./engine";

/** Unit price for a quantity under the active price promotion. Promotions never add up: the lowest single price wins. */
/**
 * `productQty`: units of the same product across all its variants in the cart. Retailer prices
 * count the whole product, so 5 black + 5 wine of one dress reach the 10-piece price.
 */
export function unitFromPrices(prices: PriceSet, qty: number, promo: PricePromo, productQty = qty, flash = false): number {
  const options = [prices.list];
  if (promo !== "none") options.push(prices[promo]);
  // On flash sale this block (see flash.ts).
  if (flash) options.push(prices.flash);
  if (Math.max(qty, productQty) >= PRICING.retailerMinQty) options.push(prices.retailer);
  return Math.min(...options);
}

/** Units per product (all variants together), for the retailer threshold. */
export function productTotals(lines: { slug: string; qty: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.slug, (m.get(l.slug) ?? 0) + l.qty);
  return m;
}

/** Weekly amount for Pay small small, rounded up to ₦100. */
export const weekly = (total: number, weeks: number) => Math.ceil(total / weeks / 100) * 100;
