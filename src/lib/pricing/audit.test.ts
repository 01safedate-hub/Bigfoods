import { describe, expect, it } from "vitest";
import { sampleVariants } from "@/lib/catalog/from-sample";
import { SAMPLE_PRODUCTS } from "@/lib/catalog/sample";
import { auditVariant, floorPrice, pausedPrices } from "./audit";
import { lineFromCosts, quoteCart } from "./engine";

describe("profit guard", () => {
  it("passes every sample product under every promotion", () => {
    for (const p of SAMPLE_PRODUCTS) {
      const line = lineFromCosts(p, 1);
      expect(auditVariant(line).verdict, p.slug).not.toBe("block");
      expect(auditVariant(line).margin, p.slug).toBeGreaterThan(0);
    }
  });
  it("its floor really is the lowest a cart can reach", () => {
    for (const p of SAMPLE_PRODUCTS.slice(0, 6)) {
      const line = lineFromCosts(p, 1);
      const floor = floorPrice(line);
      for (const promo of ["none", "midnight", "event", "flash"] as const) {
        const q = quoteCart([line], { promo, coupon: { id: "x", label: "x", amount: 1_000_000, minSpend: 0 }, pointsNaira: 1_000_000 });
        const q2 = quoteCart([line], { promo, coupon: { id: "g", label: "g", amount: 1_000_000, minSpend: 0, gadgetOnly: true }, pointsNaira: 1_000_000 });
        expect(Math.min(q.total, q2.total), `${p.slug} ${promo}`).toBeGreaterThanOrEqual(floor);
      }
    }
  });
  it("pauses promotions when costs jump, and blocks when even full price loses", () => {
    const base = lineFromCosts(SAMPLE_PRODUCTS[1], 1);
    expect(auditVariant({ ...base, cost: base.cost * 1.1 }).verdict).toBe("watch");
    expect(auditVariant({ ...base, cost: base.prices.flash }).verdict).toBe("pause");
    expect(auditVariant({ ...base, cost: base.prices.list }).verdict).toBe("block");
    expect(new Set(Object.values(pausedPrices(base.prices)))).toEqual(new Set([base.prices.list]));
  });
  it("a paused variant really sells at list price inside a mixed cart", () => {
    const guarded = { ...lineFromCosts(SAMPLE_PRODUCTS[1], 1), noDiscounts: true };
    const other = lineFromCosts(SAMPLE_PRODUCTS[0], 1);
    const q = quoteCart([guarded, other], { promo: "flash", coupon: { id: "x", label: "x", amount: 5_000, minSpend: 0 }, pointsNaira: 50_000 });
    const onlyOther = quoteCart([other], { promo: "flash", coupon: { id: "x", label: "x", amount: 5_000, minSpend: 0 }, pointsNaira: 50_000 });
    expect(q.subtotal).toBe(guarded.prices.list + other.prices.flash);
    expect(q.coupon + q.points).toBeLessThanOrEqual(onlyOther.coupon + onlyOther.points + 1);
  });
  it("covers every variant of the catalogue", () => {
    const n = SAMPLE_PRODUCTS.flatMap((p) => sampleVariants(p)).length;
    expect(n).toBe(78);
  });
});
