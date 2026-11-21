import type { PriceSet, Product } from "@/lib/catalog/types";
import { lagos } from "@/lib/time";

/**
 * Flash sale: every 6-hour block (Lagos time) a new set of products sells at its flash price.
 * Which products is worked out from the product address and the block alone, so the shop, the cart
 * and the server checkout always agree without storing anything.
 */

const BLOCK_HOURS = 6;
/** About 1 product in this many is on flash sale in any block. */
export const FLASH_ONE_IN = 12;

/** Number of the current 6-hour block since 1970 (Lagos time). */
export function flashBlock(nowMs: number): number {
  return Math.floor(lagos(nowMs).getTime() / (BLOCK_HOURS * 3_600_000));
}

/** Small, stable string hash (FNV-1a). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const discounted = (p: PriceSet) => p.flash < p.list;

/** Whether this product sells at its flash price right now. */
export function inFlash(slug: string, nowMs: number): boolean {
  return hash(`${slug}:${flashBlock(nowMs)}`) % FLASH_ONE_IN === 0;
}

/** The products on flash sale now, biggest discount first. */
export function flashPicks(products: Product[], nowMs: number, max = 12): Product[] {
  return products
    .filter((p) => discounted(p.prices) && inFlash(p.slug, nowMs))
    .sort((a, b) => b.prices.list - b.prices.flash - (a.prices.list - a.prices.flash))
    .slice(0, max);
}
