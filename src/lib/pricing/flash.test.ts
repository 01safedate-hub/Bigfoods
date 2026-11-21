import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/catalog/types";
import { FLASH_ONE_IN, flashBlock, flashPicks, inFlash } from "./flash";
import { unitFromPrices } from "./prices";

const at = (iso: string) => Date.parse(iso);
const prices = { list: 10_000, midnight: 9_000, event: 9_500, flash: 8_000, retailer: 8_500 };
const product = (slug: string, p = prices) => ({ slug, prices: p }) as unknown as Product;

describe("flash blocks", () => {
  it("change at 12am, 6am, 12pm and 6pm Lagos time", () => {
    // 05:59 and 06:00 Lagos are 04:59 and 05:00 UTC.
    expect(flashBlock(at("2026-11-21T04:59:00Z"))).not.toBe(flashBlock(at("2026-11-21T05:00:00Z")));
    expect(flashBlock(at("2026-11-21T05:00:00Z"))).toBe(flashBlock(at("2026-11-21T10:59:00Z")));
  });

  it("picks about one product in FLASH_ONE_IN, and a different set each block", () => {
    const slugs = Array.from({ length: 1200 }, (_, i) => `item-${i}`);
    const now = at("2026-11-21T09:00:00Z");
    const on = slugs.filter((s) => inFlash(s, now));
    expect(on.length).toBeGreaterThan(1200 / FLASH_ONE_IN / 2);
    expect(on.length).toBeLessThan((1200 / FLASH_ONE_IN) * 2);
    const later = slugs.filter((s) => inFlash(s, now + 6 * 3_600_000));
    expect(later).not.toEqual(on);
  });

  it("only shows products whose flash price is below the normal price", () => {
    const now = at("2026-11-21T09:00:00Z");
    const all = Array.from({ length: 400 }, (_, i) => product(`p-${i}`, i % 2 ? prices : { ...prices, flash: prices.list }));
    const picks = flashPicks(all, now, 100);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.prices.flash < p.prices.list)).toBe(true);
  });
});

describe("unitFromPrices with flash", () => {
  it("uses the flash price only when the product is on flash", () => {
    expect(unitFromPrices(prices, 1, "none")).toBe(10_000);
    expect(unitFromPrices(prices, 1, "none", 1, true)).toBe(8_000);
    // Never adds up with Midnight Drop: the lower price wins.
    expect(unitFromPrices({ ...prices, midnight: 7_000 }, 1, "midnight", 1, true)).toBe(7_000);
  });
});
