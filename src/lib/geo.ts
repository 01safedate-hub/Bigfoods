import type { Station } from "@/lib/catalog/stations";

/** Capital-city positions for every state, used when a station has no map position of its own. */
export const STATE_CENTERS: Record<string, [number, number]> = {
  Abia: [5.5249, 7.4943], Adamawa: [9.2035, 12.4954], "Akwa Ibom": [5.0377, 7.9128], Anambra: [6.2104, 7.0741],
  Bauchi: [10.3158, 9.8442], Bayelsa: [4.9267, 6.2676], Benue: [7.7322, 8.5391], Borno: [11.8333, 13.15],
  "Cross River": [4.9757, 8.3417], Delta: [6.2059, 6.6959], Ebonyi: [6.3249, 8.1137], Edo: [6.335, 5.6037],
  Ekiti: [7.6233, 5.2209], Enugu: [6.4584, 7.5464], "FCT Abuja": [9.0765, 7.3986], Gombe: [10.2897, 11.1673],
  Imo: [5.4836, 7.0333], Jigawa: [11.7562, 9.3388], Kaduna: [10.5105, 7.4165], Kano: [12.0022, 8.592],
  Katsina: [12.9908, 7.6018], Kebbi: [12.4539, 4.1975], Kogi: [7.8023, 6.7333], Kwara: [8.4966, 4.5421],
  Lagos: [6.5244, 3.3792], Nasarawa: [8.4939, 8.5153], Niger: [9.6139, 6.5569], Ogun: [7.1475, 3.3619],
  Ondo: [7.2526, 5.1931], Osun: [7.7719, 4.5624], Oyo: [7.3775, 3.947], Plateau: [9.8965, 8.8583],
  Rivers: [4.8156, 7.0498], Sokoto: [13.0059, 5.2476], Taraba: [8.8937, 11.3596], Yobe: [11.7469, 11.9608],
  Zamfara: [12.1704, 6.6641],
};
export const NIGERIAN_STATES = Object.keys(STATE_CENTERS).sort();

/** Distance in km between two points (haversine). */
export function km(a: [number, number], b: [number, number]): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const insideNigeria = ([lat, lng]: [number, number]) => lat > 4 && lat < 14 && lng > 2.6 && lng < 14.7;

/** The state whose capital is closest to a point. */
export function nearestState(p: [number, number]): string {
  return Object.entries(STATE_CENTERS).reduce((best, [s, c]) => (km(p, c) < km(p, STATE_CENTERS[best]) ? s : best), "Lagos");
}

const pos = (s: Station): [number, number] | null => (s.lat != null && s.lng != null ? [s.lat, s.lng] : STATE_CENTERS[s.state] ?? null);

/** Stations sorted by distance from a point, with the distance in km. */
export function nearestStations(p: [number, number], stations: readonly Station[], limit = 5): { station: Station; km: number }[] {
  return stations
    .map((station) => ({ station, at: pos(station) }))
    .filter((x): x is { station: Station; at: [number, number] } => x.at !== null)
    .map(({ station, at }) => ({ station, km: km(p, at) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

/** Simple search over name, area, state and address. */
export function searchStations(q: string, stations: readonly Station[]): Station[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [...stations];
  return stations.filter((s) => {
    const hay = `${s.name} ${s.area} ${s.state} ${s.address ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
