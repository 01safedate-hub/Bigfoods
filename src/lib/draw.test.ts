import { describe, expect, it } from "vitest";
import { budgetFor, commitment, eligible, type Entry, runDraw, verifyDraw } from "./draw";

const H = 3_600_000;
const DRAW_AT = Date.UTC(2026, 10, 20, 19);
const entries: Entry[] = Array.from({ length: 40 }, (_, i) => ({
  id: `e${i}`, customerId: `c${i % 30}`, cartTotal: 18_000 + i * 4_000, heldSinceMs: DRAW_AT - (i % 3 === 0 ? 10 : 48) * H,
}));

describe("Cart Clear-Out draw", () => {
  it("budget follows profit and is never more than the cap", () => {
    expect(budgetFor(-50_000)).toBe(0);
    expect(budgetFor(2_000_000)).toBe(100_000);
    expect(budgetFor(90_000_000)).toBe(500_000);
  });
  it("needs ₦20,000+, 24 hours held, one entry per customer", () => {
    const e = eligible(entries, DRAW_AT);
    expect(e.every((x) => x.cartTotal >= 20_000 && x.heldSinceMs <= DRAW_AT - 24 * H)).toBe(true);
    expect(new Set(e.map((x) => x.customerId)).size).toBe(e.length);
  });
  it("is repeatable, verifiable and never spends past the budget", async () => {
    const seed = "9f2c4e7a1b3d5f60718293a4b5c6d7e8";
    const pool = eligible(entries, DRAW_AT);
    const a = await runDraw(seed, pool, 150_000);
    const b = await runDraw(seed, pool, 150_000);
    expect(a.winners.map((w) => w.id)).toEqual(b.winners.map((w) => w.id));
    expect(a.spent).toBeLessThanOrEqual(150_000);
    expect(a.winners.length).toBeGreaterThan(0);
    const published = await commitment(seed);
    expect(await verifyDraw(seed, published, pool, 150_000, a.winners.map((w) => w.id))).toBe(true);
    expect(await verifyDraw("tampered", published, pool, 150_000, a.winners.map((w) => w.id))).toBe(false);
    const other = await runDraw("another-seed", pool, 150_000);
    expect(other.tickets).not.toEqual(a.tickets);
  });
  it("pays nobody when there is no budget", async () => {
    expect((await runDraw("s", eligible(entries, DRAW_AT), 0)).winners).toEqual([]);
  });
});
