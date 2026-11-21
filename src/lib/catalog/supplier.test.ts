import { describe, expect, it } from "vitest";
import { customTypesLabel, meetsCustomMinimum, supplierLine } from "./supplier";

describe("customTypesLabel", () => {
  it("drops the word customised and repeats", () => {
    expect(customTypesLabel("customized logo, Customized packaging, Graphic customization")).toBe("Logo, Packaging, Graphic");
    expect(customTypesLabel("Customized logo, customized logo")).toBe("Logo");
    expect(customTypesLabel("Logo/Pattern")).toBe("Logo/Pattern");
  });
});

describe("supplierLine", () => {
  it("only says reassuring things", () => {
    expect(supplierLine({ verified: true, onTime: 98.7, years: 9 })).toBe("Verified supplier · 98% on-time delivery · 9 years in business");
    expect(supplierLine({ verified: false, onTime: 70, years: 1 })).toBeNull();
    expect(supplierLine(undefined)).toBeNull();
  });
});

describe("meetsCustomMinimum", () => {
  it("compares the quantity with the factory minimum", () => {
    expect(meetsCustomMinimum(5, 100)).toBe(false);
    expect(meetsCustomMinimum(100, 100)).toBe(true);
    expect(meetsCustomMinimum(1, null)).toBe(true);
  });
});
