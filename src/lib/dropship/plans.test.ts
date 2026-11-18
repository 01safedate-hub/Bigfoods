import { describe, expect, it } from "vitest";
import { PLANS, RESERVED, SLUG_RE, sellerNet, slugify, storePrice, THEMES, themeAllowed } from "./plans";

describe("dropship plans", () => {
  it("matches what you set: free 20 products, ₦15k Pro, ₦45k Elite", () => {
    expect(PLANS.free.maxProducts).toBe(20);
    expect([PLANS.pro.price, PLANS.elite.price]).toEqual([15_000, 45_000]);
    expect(PLANS.free.customDomain).toBe(false);
  });
  it("locks premium themes by plan", () => {
    expect(themeAllowed("free", "noir")).toBe(false);
    expect(themeAllowed("pro", "noir")).toBe(true);
    expect(themeAllowed("pro", "atelier")).toBe(false);
    for (const t of THEMES) expect(themeAllowed("elite", t.key)).toBe(true);
  });
  it("store prices never go below FastChina's price and round up to ₦100", () => {
    for (const base of [6_200, 22_900, 248_200]) {
      for (const [type, v] of [["pct", 0], ["pct", 25], ["pct", 999], ["fixed", 0], ["fixed", 1_234], ["fixed", -50]] as const) {
        const { price, markup } = storePrice(base, type, v);
        expect(price).toBeGreaterThanOrEqual(base);
        expect(markup).toBe(price - base);
        expect(price % 100).toBe(0);
      }
    }
    expect(storePrice(22_900, "pct", 25)).toEqual({ price: 28_700, markup: 5_800 });
  });
  it("seller keeps the markup minus the plan fee", () => {
    expect(sellerNet(10_000, "free")).toBe(9_500);
    expect(sellerNet(10_000, "pro")).toBe(9_700);
    expect(sellerNet(10_000, "elite")).toBe(9_850);
  });
  it("store addresses", () => {
    expect(slugify("Ada’s Closet!")).toBe("adas-closet");
    expect(SLUG_RE.test("adas-closet")).toBe(true);
    expect(SLUG_RE.test("-bad")).toBe(false);
    expect(RESERVED.has("admin")).toBe(true);
  });
});
