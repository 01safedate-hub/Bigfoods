import { describe, expect, it } from "vitest";
import { choose, findVariant, initialChoice, optionStates, priceRange } from "./variants";
import type { Product, Variant } from "./types";

const P = (list: number) => ({ list, midnight: list, event: list, flash: list, retailer: list });
const v = (id: string, Colour: string, Size: string, stock: number, price: number, image?: string): Variant => ({ id, props: { Colour, Size }, stock, prices: P(price), image, wholesale: price });
// Wine has S/M/L; Black has only M/L; Wine L is sold out; Black L costs more.
const product: Pick<Product, "options" | "variants"> = {
  options: [{ name: "Colour", values: [{ label: "Wine" }, { label: "Black" }] }, { name: "Size", values: [{ label: "S" }, { label: "M" }, { label: "L" }] }],
  variants: [v("w-s", "Wine", "S", 0, 22_900, "wine.jpg"), v("w-m", "Wine", "M", 4, 22_900, "wine.jpg"), v("w-l", "Wine", "L", 0, 22_900), v("b-m", "Black", "M", 9, 22_900, "black.jpg"), v("b-l", "Black", "L", 2, 24_400)],
};
const price = (x: Variant) => x.prices.list;

describe("variant picking", () => {
  it("starts on the first in-stock combination", () => {
    expect(initialChoice(product)).toEqual({ Colour: "Wine", Size: "M" });
  });
  it("marks sold-out and missing combinations", () => {
    const s = optionStates(product, { Colour: "Black", Size: "M" }, price);
    expect(s.Size.map((x) => [x.label, x.exists, x.inStock])).toEqual([["S", false, false], ["M", true, true], ["L", true, true]]);
    expect(s.Size.find((x) => x.label === "L")!.delta).toBe(1_500);
    const w = optionStates(product, { Colour: "Wine", Size: "M" }, price);
    expect(w.Size.find((x) => x.label === "L")).toMatchObject({ exists: true, inStock: false });
  });
  it("switching colour keeps the size if possible, otherwise moves to an in-stock size", () => {
    expect(choose(product, { Colour: "Wine", Size: "M" }, "Colour", "Black")).toEqual({ Colour: "Black", Size: "M" });
    expect(choose(product, { Colour: "Black", Size: "L" }, "Colour", "Wine")).toEqual({ Colour: "Wine", Size: "M" });
  });
  it("finds the exact variant and the in-stock price range", () => {
    expect(findVariant(product, { Colour: "Black", Size: "L" })?.id).toBe("b-l");
    expect(priceRange(product, price)).toEqual({ min: 22_900, max: 24_400 });
  });
});
