import { describe, expect, it } from "vitest";
import { CHARTS, productSizes, recommend, rowMatches, sizeKindOf } from "./size-guide";
import type { Product } from "./types";

const prod = (name: string, category: string, sizes: string[] | null) =>
  ({ name, category, options: sizes ? [{ name: "Size", values: sizes.map((label) => ({ label })) }] : [] }) as unknown as Product;

describe("size guide", () => {
  it("picks the right chart, and none when sizes don't apply", () => {
    expect(sizeKindOf(prod("Men's Canvas Sneakers", "shoes", ["40", "41"]))).toBe("shoes");
    expect(sizeKindOf(prod("Men's Slim Polo Shirt", "fashion", ["M", "L"]))).toBe("men-tops");
    expect(sizeKindOf(prod("Men's Chino Trousers", "fashion", ["30", "32"]))).toBe("men-bottoms");
    expect(sizeKindOf(prod("Women Sequin Dress", "fashion", ["S", "M"]))).toBe("women-clothes");
    expect(sizeKindOf(prod("Lace front wig", "hair", ["22 inch"]))).toBe(null);
    expect(sizeKindOf(prod("Men's Polo", "fashion", null))).toBe(null);
  });
  it("matches the product's own labels, including aliases", () => {
    const sizes = productSizes(prod("x", "fashion", ["EU 42", "2xl"]));
    expect(sizes).toEqual(["42", "2XL"]);
    expect(rowMatches(CHARTS["men-tops"].rows.find((r) => r.label === "XXL")!, sizes)).toBe(true);
  });
  it("recommends by the largest measurement, within the sizes on offer", () => {
    expect(recommend(CHARTS["men-tops"], { chest: 99, height: 182 })?.label).toBe("XL");
    expect(recommend(CHARTS.shoes, { foot: 26.5 })?.label).toBe("42");
    expect(recommend(CHARTS["men-tops"], { chest: 90, height: 160 }, ["M", "L"])?.label).toBe("M");
  });
});
