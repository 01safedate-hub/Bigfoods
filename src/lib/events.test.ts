import { describe, expect, it } from "vitest";
import { bannerFor, currentEvent, FALLBACK_EVENTS, themeFor } from "./events";

const at = (iso: string) => Date.parse(iso);

describe("sale calendar", () => {
  it("runs Black Friday early access 14 days before it starts", () => {
    expect(themeFor(at("2026-11-12T12:00:00+01:00"), FALLBACK_EVENTS)).toBe("everyday");
    const b = bannerFor(at("2026-11-17T03:00:00+01:00"), FALLBACK_EVENTS);
    expect(b.key).toBe("black-friday");
    expect(b.kicker).toContain("EARLY ACCESS");
  });

  it("switches to the live event and back to everyday by itself", () => {
    expect(currentEvent(at("2026-11-28T10:00:00+01:00"), FALLBACK_EVENTS)?.early).toBe(false);
    expect(themeFor(at("2026-12-05T10:00:00+01:00"), FALLBACK_EVENTS)).toBe("gadget-hunt");
    expect(themeFor(at("2026-12-20T10:00:00+01:00"), FALLBACK_EVENTS)).toBe("christmas");
    expect(themeFor(at("2026-12-28T10:00:00+01:00"), FALLBACK_EVENTS)).toBe("everyday");
  });

  it("uses Lagos dates: an event ends at 23:59 Lagos time", () => {
    expect(themeFor(at("2026-12-26T23:30:00+01:00"), FALLBACK_EVENTS)).toBe("christmas");
    expect(themeFor(at("2026-12-27T00:30:00+01:00"), FALLBACK_EVENTS)).toBe("everyday");
  });
});
