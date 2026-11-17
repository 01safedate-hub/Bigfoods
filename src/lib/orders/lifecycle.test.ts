import { describe, expect, it } from "vitest";
import { arrivalWindow, autoDeliverDue, canMove, move, ORDER_STATUSES, splitShipments, trackingStep } from "./lifecycle";

const DAY = 86_400_000;

describe("order lifecycle", () => {
  it("never buys before full payment", () => {
    expect(canMove("part_paid", "purchasing")).toBe(false);
    expect(canMove("awaiting_payment", "purchasing")).toBe(false);
    expect(canMove("paid", "purchasing")).toBe(true);
  });
  it("stops cancellations once the item is bought", () => {
    expect(canMove("purchasing", "cancelled")).toBe(true);
    for (const s of ["purchased", "at_warehouse", "shipped", "delivered"] as const) expect(canMove(s, "cancelled")).toBe(false);
  });
  it("only refunds a shipped order, and final states are final", () => {
    expect(canMove("shipped", "refunded")).toBe(true);
    expect(canMove("delivered", "refunded")).toBe(false);
    expect(() => move("delivered", "shipped")).toThrow();
    for (const s of ORDER_STATUSES) expect(canMove(s, s)).toBe(false);
  });
  it("auto-delivers exactly 10 days after shipping", () => {
    const shipped = Date.UTC(2026, 10, 1);
    expect(autoDeliverDue(shipped, shipped + 10 * DAY - 1)).toBe(false);
    expect(autoDeliverDue(shipped, shipped + 10 * DAY)).toBe(true);
  });
  it("tracks steps and splits air and sea", () => {
    expect(trackingStep("shipped")).toMatchObject({ step: 4, of: 5 });
    expect(trackingStep("cancelled").step).toBe(0);
    const w = arrivalWindow("sea", 0);
    expect([w.from / DAY, w.to / DAY]).toEqual([90, 110]);
    const s = splitShipments([{ shipMode: "air" as const }, { shipMode: "sea" as const }, { shipMode: "air" as const }]);
    expect([s.air.length, s.sea.length]).toEqual([2, 1]);
  });
});
