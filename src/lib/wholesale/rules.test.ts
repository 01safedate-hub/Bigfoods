import { describe, expect, it } from "vitest";
import { SAMPLE_PRODUCTS } from "@/lib/catalog/sample";
import { sampleToProduct } from "@/lib/catalog/from-sample";
import { DEFAULT_KITS, kitLines, MIN_QTY, shortProducts } from "./rules";

const products = SAMPLE_PRODUCTS.map(sampleToProduct);

describe("wholesale", () => {
  it("fills kits with best sellers from their categories, at least the minimum each", () => {
    const lines = kitLines(DEFAULT_KITS[0], products);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) {
      expect(DEFAULT_KITS[0].categories).toContain(l.product.category);
      expect(l.qty).toBeGreaterThanOrEqual(MIN_QTY);
    }
    const sold = lines.map((l) => l.product.sold);
    expect([...sold].sort((a, b) => b - a)).toEqual(sold);
  });
  it("counts the minimum per product across variants", () => {
    expect(shortProducts([{ slug: "a", variantId: "1", qty: 6 }, { slug: "a", variantId: "2", qty: 4 }])).toEqual([]);
    expect(shortProducts([{ slug: "a", variantId: "1", qty: 6 }, { slug: "b", variantId: "2", qty: 12 }])).toEqual(["a"]);
  });
  it("prices every sample product for wholesale below its single price", () => {
    for (const p of products) expect(p.wholesaleFrom).toBeLessThan(p.prices.list);
  });
});
