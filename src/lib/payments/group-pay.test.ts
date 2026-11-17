import { describe, expect, it } from "vitest";
import { acceptContribution, linkState, proRata } from "./group-pay";

const DAY = 86_400_000;
const items = [{ id: "phone", amount: 248_200 }, { id: "dress", amount: 22_900 }, { id: "watch", amount: 15_200 }];
const target = 286_300;

describe("group pay links", () => {
  it("never accepts more than what's left, and refuses tiny amounts", () => {
    expect(acceptContribution(target, 280_000, 50_000, 0, 0)).toEqual({ ok: true, accepted: 6_300 });
    expect(acceptContribution(target, 0, 300, 0, 0).ok).toBe(false);
    expect(acceptContribution(target, target - 200, 200, 0, 0)).toEqual({ ok: true, accepted: 200 });
    expect(acceptContribution(target, target, 1_000, 0, 0).ok).toBe(false);
    expect(acceptContribution(target, 0, 5_000, 7 * DAY, 0).ok).toBe(false);
  });
  it("releases items top first as soon as they are covered", () => {
    const s = linkState(items, [{ id: "a", amount: 200_000 }, { id: "b", amount: 60_000 }], DAY, 0);
    expect(s.released).toEqual(["phone"]);
    expect(s.open).toBe(true);
    expect(s.leftover).toBe(0);
  });
  it("refunds leftovers pro rata at expiry, exact to the naira", () => {
    const cs = [{ id: "a", amount: 200_000 }, { id: "b", amount: 60_001 }, { id: "c", amount: 7 }];
    const s = linkState(items, cs, 7 * DAY, 0);
    expect(s.open).toBe(false);
    expect(s.released).toEqual(["phone"]);
    expect(s.leftover).toBe(11_808);
    expect([...s.refunds.values()].reduce((a, b) => a + b, 0)).toBe(11_808);
    expect(s.refunds.get("a")).toBeGreaterThan(s.refunds.get("b")!);
  });
  it("splits any pool exactly", () => {
    const r = proRata(100, [{ id: "x", amount: 1 }, { id: "y", amount: 1 }, { id: "z", amount: 1 }]);
    expect([...r.values()].sort()).toEqual([33, 33, 34]);
  });
});
