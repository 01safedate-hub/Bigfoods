import { describe, expect, it } from "vitest";
import { quoteCart } from "./engine";
import { productTotals, unitFromPrices } from "./prices";

const prices = { list: 20_000, midnight: 18_000, event: 17_000, flash: 15_000, retailer: 16_000 };

describe("retailer price across variants", () => {
  it("counts every variant of a product towards 10", () => {
    const totals = productTotals([{ slug: "dress", qty: 5 }, { slug: "dress", qty: 5 }, { slug: "bag", qty: 3 }]);
    expect(totals.get("dress")).toBe(10);
    expect(unitFromPrices(prices, 5, "none", totals.get("dress"))).toBe(16_000);
    expect(unitFromPrices(prices, 3, "none", totals.get("bag"))).toBe(20_000);
  });
  it("keeps 10+ lines out of coupon eligibility when counted by product", () => {
    const line = { prices, cost: 10_000, plannedProfit: 8_000, gadget: false, qty: 5, productQty: 10 };
    const q = quoteCart([line, { ...line }], { coupon: { id: "c", amount: 2_000, minSpend: 0, gadgetOnly: false } as never });
    expect(q.subtotal).toBe(160_000);
    expect(q.coupon).toBe(0);
  });
});
