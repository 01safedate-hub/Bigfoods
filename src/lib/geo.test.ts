import { describe, expect, it } from "vitest";
import { STATIONS } from "@/lib/catalog/stations";
import { insideNigeria, km, nearestState, nearestStations, searchStations } from "./geo";

describe("geo", () => {
  it("measures distance", () => {
    expect(Math.round(km([6.5244, 3.3792], [9.0765, 7.3986]))).toBeGreaterThan(500);
  });
  it("finds the nearest state and station", () => {
    expect(nearestState([6.45, 3.47])).toBe("Lagos");
    expect(nearestState([9.05, 7.49])).toBe("FCT Abuja");
    expect(nearestStations([6.44, 3.48], STATIONS, 1)[0].station.id).toBe("lag-lekki-1");
    expect(nearestStations([4.82, 7.0], STATIONS, 1)[0].station.id).toBe("riv-ph-1");
  });
  it("knows when a point is outside Nigeria", () => {
    expect(insideNigeria([51.5, -0.12])).toBe(false);
    expect(insideNigeria([6.5, 3.4])).toBe(true);
  });
  it("searches by area and state", () => {
    expect(searchStations("ikeja", STATIONS)).toHaveLength(2);
    expect(searchStations("port harcourt", STATIONS)[0].state).toBe("Rivers");
  });
});
