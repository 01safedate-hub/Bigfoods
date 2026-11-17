import { describe, expect, it } from "vitest";
import { flashEnds, midnightDrop, nextDraw } from "./time";

/** Build a UTC ms from a Lagos wall-clock time (UTC+1). */
const lagosAt = (iso: string) => Date.parse(`${iso}+01:00`);

describe("midnightDrop", () => {
  it("is live between 00:00 and 04:00 Lagos time", () => {
    expect(midnightDrop(lagosAt("2026-11-17T00:00:00")).live).toBe(true);
    expect(midnightDrop(lagosAt("2026-11-17T03:59:59")).live).toBe(true);
    expect(midnightDrop(lagosAt("2026-11-17T04:00:00")).live).toBe(false);
    expect(midnightDrop(lagosAt("2026-11-16T23:59:59")).live).toBe(false);
  });

  it("counts down to the right boundary", () => {
    expect(midnightDrop(lagosAt("2026-11-16T23:00:00")).msLeft).toBe(3_600_000);
    expect(midnightDrop(lagosAt("2026-11-17T03:00:00")).msLeft).toBe(3_600_000);
  });
});

describe("nextDraw", () => {
  it("targets Friday 8pm Lagos time", () => {
    // Monday 16 Nov 2026, 8pm → Friday 20 Nov 8pm = 4 days
    expect(nextDraw(lagosAt("2026-11-16T20:00:00"))).toBe(4 * 86_400_000);
    // Friday after the draw rolls to next week
    expect(nextDraw(lagosAt("2026-11-20T21:00:00"))).toBe(7 * 86_400_000 - 3_600_000);
  });
});

describe("flashEnds", () => {
  it("ends at the next 6-hour block", () => {
    expect(flashEnds(lagosAt("2026-11-17T13:00:00"))).toBe(5 * 3_600_000);
  });
});
