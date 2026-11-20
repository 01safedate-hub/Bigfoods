import { describe, expect, it } from "vitest";
import { audienceOf } from "./audience";

describe("audience", () => {
  it("reads who a product is for from its name", () => {
    expect(audienceOf({ name: "Men's Casual Polo Shirt" })).toBe("men");
    expect(audienceOf({ name: "Women Sequin Bodycon Mini Dress" })).toBe("women");
    expect(audienceOf({ name: "Ladies' Thick Soled Slippers" })).toBe("women");
    expect(audienceOf({ name: "Unisex Hoodie for Men and Women" })).toBe("all");
    expect(audienceOf({ name: "Striped Canvas Tote Bag" })).toBe("all");
  });
});
