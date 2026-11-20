import { describe, expect, it } from "vitest";
import { SAMPLE_PRODUCTS } from "@/lib/catalog/sample";
import { FALLBACK_COUPONS } from "@/lib/catalog/coupons";
import { PRICING } from "./config";
import { lineFromCosts, quoteCart, type PricePromo } from "./engine";

const PROMOS: PricePromo[] = ["none", "midnight", "event", "flash"];

describe("discount audit: every cart, every promo, every coupon", () => {
  // Carts of 1–3 products in different quantities, including retailer quantities.
  const carts = SAMPLE_PRODUCTS.flatMap((a, i) => [
    [lineFromCosts(a, 1)],
    [lineFromCosts(a, 2), lineFromCosts(SAMPLE_PRODUCTS[(i + 3) % SAMPLE_PRODUCTS.length], 1)],
    [lineFromCosts(a, 10), lineFromCosts(SAMPLE_PRODUCTS[(i + 7) % SAMPLE_PRODUCTS.length], 3)],
  ]);

  it("the bill always adds up exactly, in whole naira", () => {
    for (const lines of carts) for (const promo of PROMOS) for (const coupon of [null, ...FALLBACK_COUPONS]) for (const pointsNaira of [0, 999, 1_000_000]) {
      const q = quoteCart(lines, { promo, coupon, pointsNaira });
      expect(q.total).toBe(q.subtotal - q.coupon - q.points);
      for (const n of [q.total, q.coupon, q.points, q.subtotal]) expect(Number.isInteger(n)).toBe(true);
      expect(q.coupon).toBeGreaterThanOrEqual(0);
      expect(q.points).toBeGreaterThanOrEqual(0);
      expect(q.points).toBeLessThanOrEqual(Math.min(pointsNaira, PRICING.guardrails.maxPointsShareOfOrder * (q.subtotal - q.coupon)));
    }
  });

  it("never loses money and never gives more than half the planned profit away", () => {
    for (const lines of carts) for (const promo of PROMOS) for (const coupon of [null, ...FALLBACK_COUPONS]) {
      const q = quoteCart(lines, { promo, coupon, pointsNaira: 1_000_000 });
      expect(q.profitKept, `${promo} ${coupon?.id}`).toBeGreaterThan(0);
      const given = q.priceSavings + q.coupon + q.points;
      const cap = PRICING.guardrails.maxDiscountShareOfProfit * q.plannedProfit;
      // Promo prices alone may reach the cap; coupons and points only use what's left.
      expect(q.coupon + q.points).toBeLessThanOrEqual(Math.max(0, cap - q.priceSavings) + 1);
      expect(given).toBeLessThanOrEqual(Math.max(cap, q.priceSavings) + 1);
    }
  });

  it("gadget coupons only touch gadgets, normal coupons never do", () => {
    // The dearest gadget, so the cart clears the gadget coupon's minimum spend.
    const phone = lineFromCosts([...SAMPLE_PRODUCTS].filter((p) => p.category === "gadgets").sort((a, b) => b.cny - a.cny)[0], 1);
    const dress = lineFromCosts(SAMPLE_PRODUCTS.find((p) => p.category === "fashion")!, 2);
    const normal = FALLBACK_COUPONS.find((c) => !c.gadgetOnly && c.minSpend === 0)!;
    const gadget = FALLBACK_COUPONS.find((c) => c.gadgetOnly)!;
    expect(quoteCart([phone], { coupon: normal }).coupon).toBe(0);
    expect(quoteCart([dress], { coupon: gadget }).coupon).toBe(0);
    expect(quoteCart([phone, dress], { coupon: gadget }).coupon).toBeGreaterThan(0);
  });

  it("retailer quantities (10+) take no coupons", () => {
    const bulk = lineFromCosts(SAMPLE_PRODUCTS.find((p) => p.category === "fashion")!, 10);
    expect(quoteCart([bulk], { coupon: FALLBACK_COUPONS.find((c) => c.id === "fashion-10")! }).coupon).toBe(0);
  });

  it("minimum spend counts eligible items only, after promo prices", () => {
    const phone = lineFromCosts(SAMPLE_PRODUCTS.find((p) => p.category === "gadgets")!, 1);
    const q = quoteCart([phone, lineFromCosts(SAMPLE_PRODUCTS.find((p) => p.slug === "mens-steel-quartz-watch")!, 1)], { coupon: FALLBACK_COUPONS.find((c) => c.id === "big-5000")! });
    expect(q.coupon).toBe(0);
    expect(q.couponNote).toMatch(/Spend/);
  });
});
