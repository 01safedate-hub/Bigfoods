import { describe, expect, it } from "vitest";
import { imagesFor, keywords } from "./thumbs";
import type { Product } from "./types";

const p = (name: string, category: string, sold: number, img = `/${name}.jpg`) =>
  ({ name, category, sold, images: [img], wholesale: false }) as unknown as Product;

const all = [
  p("Lace Front Wig 13x4", "hair", 50),
  p("Bob Wig", "hair", 90),
  p("Men Quartz Watch", "jewellery", 10),
  p("Gold Chain Necklace", "jewellery", 40),
  p("No photo", "hair", 99, ""),
];

describe("keywords", () => {
  it("keeps the product words in singular", () => {
    expect(keywords("Lace front wigs")).toEqual(["lace", "front", "wig"]);
    expect(keywords("Men quartz watches")).toEqual(["quartz", "watch"]);
  });
});

describe("imagesFor", () => {
  it("prefers products naming every word, best sellers first", () => {
    expect(imagesFor(all, { name: "Lace front wigs" })).toEqual(["/Lace Front Wig 13x4.jpg"]);
    expect(imagesFor(all, { category: "hair" })).toEqual(["/Bob Wig.jpg", "/Lace Front Wig 13x4.jpg"]);
  });
  it("falls back to any word, then the category", () => {
    expect(imagesFor(all, { name: "Chain necklaces", category: "jewellery" })).toEqual(["/Gold Chain Necklace.jpg"]);
    expect(imagesFor(all, { name: "Pearl earrings", category: "jewellery" })).toEqual(["/Gold Chain Necklace.jpg", "/Men Quartz Watch.jpg"]);
    expect(imagesFor(all, { name: "Pearl earrings" })).toEqual([]);
  });
});
