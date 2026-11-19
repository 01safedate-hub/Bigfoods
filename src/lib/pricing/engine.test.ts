import { describe, expect, it } from "vitest";
import { NAIRA_PER_CNY, PRICING } from "./config";
import { type Coupon, type Costable, type PricePromo, lineFromCosts, localDeliveryFee, priceOf, quoteCart, unitPrice, WHOLESALE_MARGIN } from "./engine";
import { COUPONS } from "@/lib/catalog/coupons";
import { SAMPLE_PRODUCTS as PRODUCTS } from "@/lib/catalog/sample";

const dress: Costable = { cny: 28, weightKg: 0.3, category: "fashion" };
const phone: Costable = { cny: 620, weightKg: 0.45, category: "gadgets" };
const chair: Costable = { cny: 260, weightKg: 18, cbm: 0.25, category: "furniture" };

describe("exchange rate", () => {
  it("uses ₦315 per ¥1 (₦2,100/$ ÷ ¥6.6664/$)", () => {
    expect(NAIRA_PER_CNY).toBe(315);
  });
});

describe("priceOf", () => {
  it("charges profit on goods only and passes freight, clearing and last-mile through", () => {
    const b = priceOf(dress);
    expect(b.goods).toBe(28 * 315);
    expect(b.plannedProfit).toBeCloseTo(28 * 315 * 0.8);
    expect(b.logistics).toBeCloseTo(0.3 * (PRICING.airPerKg + PRICING.clearingPerKg));
    expect(b.list).toBeGreaterThan(b.cost + b.plannedProfit);
    expect(b.list % 100).toBe(0);
  });

  it("prices gadgets at 10% + ₦50,000", () => {
    const b = priceOf(phone);
    expect(b.plannedProfit).toBeCloseTo(620 * 315 * 0.1 + 50_000);
  });

  it("sends furniture by sea and charges per CBM", () => {
    const b = priceOf(chair);
    expect(b.logistics).toBeCloseTo(0.25 * PRICING.seaPerCbm + 18 * PRICING.seaClearingPerKg);
  });

  it("adds local delivery by size and the weighing fee", () => {
    expect(localDeliveryFee(0.1)).toBe(400);
    expect(localDeliveryFee(0.8)).toBe(700);
    expect(localDeliveryFee(25)).toBe(2_000);
    expect(localDeliveryFee(1, 0.3)).toBe(2_000);
    expect(priceOf(dress).lastMile).toBe(localDeliveryFee(dress.weightKg) + PRICING.weighingFeePerItem);
  });

  it("prices wholesale by sea, never below cost", () => {
    for (const p of [dress, chair]) {
      const b = priceOf(p);
      expect(b.wholesale).toBeGreaterThanOrEqual(b.wholesaleCost + b.wholesaleProfit);
      expect(b.wholesaleProfit).toBeCloseTo(b.goods * WHOLESALE_MARGIN[p.category]);
    }
    // Light air goods are much cheaper wholesale (sea) than single (air).
    expect(priceOf(dress).wholesale).toBeLessThan(priceOf(dress).retailer);
  });

  it("orders promo prices from cheapest to list", () => {
    const b = priceOf(dress);
    expect(b.flash).toBeLessThan(b.retailer);
    expect(b.retailer).toBeLessThan(b.event);
    expect(b.event).toBeLessThan(b.midnight);
    expect(b.midnight).toBeLessThan(b.list);
  });
});

describe("unitPrice", () => {
  it("never adds price promotions together; the lowest single price wins", () => {
    const b = priceOf(dress);
    expect(unitPrice(dress, 10, "midnight")).toBe(b.retailer);
    expect(unitPrice(dress, 10, "flash")).toBe(b.flash);
    expect(unitPrice(dress, 1, "none")).toBe(b.list);
  });
});

describe("quoteCart guardrails", () => {
  const promos: PricePromo[] = ["none", "midnight", "event", "flash"];
  const coupons: Array<Coupon | null> = [null, ...COUPONS];

  it("never sells any catalogue item, at any quantity, with any promo stack, below 49% of planned profit", () => {
    for (const p of PRODUCTS) {
      for (const qty of [1, 2, 5, 10, 25]) {
        for (const promo of promos) {
          for (const coupon of coupons) {
            for (const pointsNaira of [0, 1_240, 50_000]) {
              const q = quoteCart([lineFromCosts(p, qty)], { promo, coupon, pointsNaira });
              expect(q.profitKept, `${p.slug} x${qty} ${promo} ${coupon?.id} ${pointsNaira}`).toBeGreaterThan(0);
              expect(q.profitKept).toBeGreaterThanOrEqual(0.49 * q.plannedProfit);
            }
          }
        }
      }
    }
  });

  it("keeps mixed carts profitable too", () => {
    const lines = PRODUCTS.slice(0, 8).map((product, i) => lineFromCosts(product, (i % 3) + 1));
    for (const coupon of coupons) {
      const q = quoteCart(lines, { promo: "flash", coupon, pointsNaira: 100_000 });
      expect(q.profitKept).toBeGreaterThanOrEqual(0.49 * q.plannedProfit);
    }
  });

  it("does not apply normal coupons to gadgets", () => {
    const q = quoteCart([lineFromCosts(phone, 1)], { coupon: { id: "x", label: "₦1,500", amount: 1500, minSpend: 0 } });
    expect(q.coupon).toBe(0);
    expect(q.couponNote).toMatch(/eligible/);
  });

  it("does not apply coupons to retailer (10+) lines", () => {
    const q = quoteCart([lineFromCosts(dress, 10)], { coupon: { id: "x", label: "₦500", amount: 500, minSpend: 0 } });
    expect(q.coupon).toBe(0);
  });

  it("caps points at 10% of the order", () => {
    const q = quoteCart([lineFromCosts(dress, 1)], { pointsNaira: 1_000_000 });
    expect(q.points).toBeLessThanOrEqual(0.1 * q.subtotal + 1);
  });

  it("explains an unmet minimum spend", () => {
    const q = quoteCart([lineFromCosts(dress, 1)], { coupon: { id: "x", label: "₦5,000", amount: 5000, minSpend: 60_000 } });
    expect(q.coupon).toBe(0);
    expect(q.couponNote).toMatch(/Spend/);
  });
});
