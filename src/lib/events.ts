import { lagos } from "@/lib/time";

export type ThemeKey = "everyday" | "black-friday" | "gadget-hunt" | "christmas" | "valentine";

export interface EventTheme {
  key: ThemeKey;
  kicker: string;
  title: string;
  sub: string;
}

/**
 * Sale calendar. In production this is the `events` table; a scheduled edge
 * function switches the active theme and sends reminders when an event starts.
 */
export const EVENTS = [
  { name: "Black Friday", start: "2026-11-27", end: "2026-11-30", theme: "black-friday", color: "#111111" },
  { name: "Cyber Monday", start: "2026-11-30", end: "2026-11-30", theme: "black-friday", color: "#4F46E5" },
  { name: "Gadget Hunt", start: "2026-12-04", end: "2026-12-10", theme: "gadget-hunt", color: "#1D4ED8" },
  { name: "Christmas Sale", start: "2026-12-11", end: "2026-12-26", theme: "christmas", color: "#0F3D2E" },
  { name: "New Year Restock", start: "2027-01-01", end: "2027-01-07", theme: "everyday", color: "#A27B1E" },
  { name: "Valentine", start: "2027-02-01", end: "2027-02-14", theme: "valentine", color: "#B4235A" },
] as const;

export const THEMES: Record<ThemeKey, EventTheme> = {
  everyday: { key: "everyday", kicker: "NEW THIS WEEK", title: "Fresh from\n1688 factories", sub: "Shipping is always free to your pickup station" },
  "black-friday": { key: "black-friday", kicker: "BLACK FRIDAY · EARLY ACCESS", title: "UP TO\n50% OFF", sub: "Midnight Drop prices on top, every night" },
  "gadget-hunt": { key: "gadget-hunt", kicker: "GADGET HUNT · 4–10 DEC", title: "Phones, laptops\n& drones", sub: "New gadget deals drop every 3 hours" },
  christmas: { key: "christmas", kicker: "CHRISTMAS · ORDER BY 10 DEC FOR AIR", title: "Gifts for\neveryone", sub: "Group pay the family wish list" },
  valentine: { key: "valentine", kicker: "VALENTINE · 1–14 FEB", title: "Love, delivered\nfrom China", sub: "Gifts under ₦20,000" },
};

/** Black Friday early access runs from 13 Nov. */
export function themeFor(nowMs: number): ThemeKey {
  const l = lagos(nowMs);
  const m = l.getUTCMonth() + 1;
  const d = l.getUTCDate();
  if (m === 11 && d >= 13) return "black-friday";
  if (m === 12 && d >= 4 && d <= 10) return "gadget-hunt";
  if (m === 12 && d >= 11 && d <= 26) return "christmas";
  if (m === 2 && d <= 14) return "valentine";
  return "everyday";
}

export function eventStatus(nowMs: number, start: string, end: string) {
  const s = Date.parse(`${start}T00:00:00+01:00`);
  const e = Date.parse(`${end}T23:59:59+01:00`);
  if (nowMs >= s && nowMs <= e) return { live: true, label: "Live now" };
  if (nowMs > e) return { live: false, label: "Ended" };
  const days = Math.ceil((s - nowMs) / 86_400_000);
  return { live: false, label: `Starts in ${days} day${days === 1 ? "" : "s"}` };
}

export const eventDates = (start: string, end: string) => {
  const f = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return start === end ? f(start) : `${f(start)} – ${f(end)}`;
};
