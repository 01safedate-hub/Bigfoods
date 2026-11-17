import { describe, expect, it } from "vitest";
import { buildSchedule, planOptions, planStatus } from "./instalments";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 17, 9);

describe("Pay small small", () => {
  it("adds up to the total exactly, with round later payments", () => {
    for (const total of [10_000, 19_736, 22_901, 275_900, 1_010_499]) {
      for (const weeks of [4, 8, 12]) {
        const s = buildSchedule(total, weeks, T0);
        expect(s.reduce((a, i) => a + i.amount, 0)).toBe(total);
        expect(s.slice(1).every((i) => i.amount % 100 === 0 && i.amount <= s[0].amount)).toBe(true);
        expect(s[weeks - 1].dueMs - T0).toBe((weeks - 1) * 7 * DAY);
      }
    }
  });
  it("only offers plans that are worth it", () => {
    expect(planOptions(9_999)).toEqual([]);
    expect(planOptions(19_736)).toEqual([4, 8]);
    expect(planOptions(275_900)).toEqual([4, 8, 12]);
  });
  it("is on track, late after the grace period, cancelled after 14 days", () => {
    const s = buildSchedule(40_000, 4, T0); // 10,000 a week
    expect(planStatus(s, 10_000, T0 + 1 * DAY).state).toBe("on_track");
    expect(planStatus(s, 10_000, T0 + 9 * DAY)).toMatchObject({ state: "on_track", overdue: 10_000 });
    expect(planStatus(s, 10_000, T0 + 11 * DAY).state).toBe("late");
    expect(planStatus(s, 10_000, T0 + 21 * DAY).state).toBe("cancel");
    expect(planStatus(s, 40_000, T0 + 21 * DAY).state).toBe("complete");
  });
  it("lets part-payments count towards the next instalment", () => {
    const s = buildSchedule(40_000, 4, T0);
    const st = planStatus(s, 14_000, T0 + 8 * DAY);
    expect(st).toMatchObject({ overdue: 6_000, remaining: 26_000 });
    expect(st.next?.n).toBe(2);
  });
});
