import { describe, expect, it } from "vitest";
import { canPaySmall, progressPct, validPayment } from "./instalments";

describe("Pay small small", () => {
  it("is for orders of ₦10,000 or more", () => {
    expect(canPaySmall(9_999)).toBe(false);
    expect(canPaySmall(10_000)).toBe(true);
  });
  it("takes any amount from ₦1,000, or exactly what's left", () => {
    expect(validPayment(1_000, 50_000)).toBe(true);
    expect(validPayment(999, 50_000)).toBe(false);
    expect(validPayment(600, 600)).toBe(true);
    expect(validPayment(50_001, 50_000)).toBe(false);
    expect(validPayment(1_500.5, 50_000)).toBe(false);
  });
  it("shows progress without passing 100%", () => {
    expect(progressPct(25_000, 100_000)).toBe(25);
    expect(progressPct(120_000, 100_000)).toBe(100);
  });
});
