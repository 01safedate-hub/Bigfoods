import type { PriceSet } from "@/lib/catalog/types";
import { PRICING } from "./config";
import type { PricePromo } from "./engine";

/** Unit price for a quantity under the active price promotion. Promotions never add up: the lowest single price wins. */
export function unitFromPrices(prices: PriceSet, qty: number, promo: PricePromo): number {
  const options = [prices.list];
  if (promo !== "none") options.push(prices[promo]);
  if (qty >= PRICING.retailerMinQty) options.push(prices.retailer);
  return Math.min(...options);
}

/** Weekly amount for Pay small small, rounded up to ₦100. */
export const weekly = (total: number, weeks: number) => Math.ceil(total / weeks / 100) * 100;
