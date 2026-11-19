import { describe, expect, it } from "vitest";
import { combinations, validateCustomProduct } from "./rules";

const base = {
  title: "Ribbed knit two-piece set",
  category: "fashion",
  weight_kg: 0.4,
  images: [],
  options: [{ name: "Colour", values: ["Black", "Wine"] }, { name: "Size", values: ["M", "L"] }],
  variants: combinations([{ name: "Colour", values: ["Black", "Wine"] }, { name: "Size", values: ["M", "L"] }]).map((props) => ({ props, cost: 45, currency: "cny", stock: 10 })),
};

describe("combinations", () => {
  it("builds every option pairing", () => {
    expect(combinations(base.options)).toHaveLength(4);
    expect(combinations([])).toEqual([{}]);
  });
});

describe("validateCustomProduct", () => {
  it("accepts a valid product", () => {
    const r = validateCustomProduct(base, null);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe("draft");
  });
  it("refuses photos hosted elsewhere", () => {
    const r = validateCustomProduct({ ...base, images: ["https://evil.example/x.jpg"] }, "https://x.supabase.co/storage/v1/object/public/product-images/");
    expect(r.ok).toBe(false);
  });
  it("refuses variants that don't match the options", () => {
    const r = validateCustomProduct({ ...base, variants: [{ props: { Colour: "Blue" }, cost: 10, currency: "cny", stock: 1 }] }, null);
    expect(r.ok).toBe(false);
  });
  it("refuses a zero cost and a missing weight", () => {
    expect(validateCustomProduct({ ...base, variants: [{ ...base.variants[0], cost: 0 }] }, null).ok).toBe(false);
    expect(validateCustomProduct({ ...base, weight_kg: 0 }, null).ok).toBe(false);
  });
});
