import { describe, expect, it } from "vitest";
import { departmentBySlug, departmentCircles, departmentProducts } from "./departments";
import type { Product } from "./types";

const p = (name: string, category: string, sold = 1): Product =>
  ({ slug: name, name, category, sold, images: [`https://x/${name}.jpg`] }) as unknown as Product;

describe("departments", () => {
  const all = [
    p("Men's Slim Polo Shirt", "fashion", 5), p("Women Sequin Bodycon Dress", "fashion", 9), p("Men's Denim Bomber Jacket", "fashion", 3),
    p("Men's Chino Trousers", "fashion", 2), p("Unisex Canvas Sneakers", "shoes", 7), p("Men's Perfume 100ml", "beauty", 1), p("Lipstick set", "beauty", 4),
  ];
  it("keeps women's items out of Men, and unisex items in both", () => {
    const men = departmentProducts(departmentBySlug("men")!, all).map((x) => x.name);
    expect(men).not.toContain("Women Sequin Bodycon Dress");
    expect(men).toContain("Unisex Canvas Sneakers");
    expect(men[0]).toBe("Unisex Canvas Sneakers");
  });
  it("shows only circles that have products, with a photo", () => {
    const d = departmentBySlug("men")!;
    const circles = departmentCircles(d, departmentProducts(d, all));
    expect(circles.map((c) => c.slug)).toEqual(["polos", "jackets", "trousers", "sneakers", "perfume"]);
    expect(circles.every((c) => c.image)).toBe(true);
  });
});
