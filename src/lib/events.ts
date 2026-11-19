export type ThemeKey = "everyday" | "black-friday" | "gadget-hunt" | "christmas" | "valentine";

export interface EventTheme {
  key: ThemeKey;
  kicker: string;
  title: string;
  sub: string;
}

export interface SaleEvent {
  name: string;
  start: string; // YYYY-MM-DD, Lagos dates
  end: string;
  theme: ThemeKey;
  color: string;
  kicker: string;
  title: string;
  sub: string;
  /** Days before `start` when the theme and banner switch on as "early access". */
  earlyAccessDays: number;
}

export const THEMES: Record<ThemeKey, EventTheme> = {
  everyday: { key: "everyday", kicker: "NEW THIS WEEK", title: "Fresh from\nthe factory floor", sub: "Shipping is always free to your pickup station" },
  "black-friday": { key: "black-friday", kicker: "BLACK FRIDAY", title: "UP TO\n50% OFF", sub: "Midnight Drop prices on top, every night" },
  "gadget-hunt": { key: "gadget-hunt", kicker: "GADGET HUNT · 4–10 DEC", title: "Phones, laptops\n& drones", sub: "New gadget deals drop every 3 hours" },
  christmas: { key: "christmas", kicker: "CHRISTMAS · ORDER BY 10 DEC FOR AIR", title: "Gifts for\neveryone", sub: "Group pay the family wish list" },
  valentine: { key: "valentine", kicker: "VALENTINE · 1–14 FEB", title: "Love, delivered\nfrom China", sub: "Gifts under ₦20,000" },
};

/** Fallback calendar, used only when the database isn't connected (the live one is the `sale_events` table). */
export const FALLBACK_EVENTS: SaleEvent[] = [
  { name: "Black Friday", start: "2026-11-27", end: "2026-11-30", theme: "black-friday", color: "#111111", ...copy("black-friday"), earlyAccessDays: 14 },
  { name: "Cyber Monday", start: "2026-11-30", end: "2026-11-30", theme: "black-friday", color: "#4F46E5", kicker: "CYBER MONDAY", title: "ONE DAY\nONLY", sub: "Gadgets and audio at event prices", earlyAccessDays: 0 },
  { name: "Gadget Hunt", start: "2026-12-04", end: "2026-12-10", theme: "gadget-hunt", color: "#1D4ED8", ...copy("gadget-hunt"), earlyAccessDays: 0 },
  { name: "Christmas Sale", start: "2026-12-11", end: "2026-12-26", theme: "christmas", color: "#0F3D2E", ...copy("christmas"), earlyAccessDays: 0 },
  { name: "New Year Restock", start: "2027-01-01", end: "2027-01-07", theme: "everyday", color: "#A27B1E", ...copy("everyday"), kicker: "NEW YEAR RESTOCK", earlyAccessDays: 0 },
  { name: "Valentine", start: "2027-02-01", end: "2027-02-14", theme: "valentine", color: "#B4235A", ...copy("valentine"), earlyAccessDays: 0 },
];

function copy(k: ThemeKey) {
  const { kicker, title, sub } = THEMES[k];
  return { kicker, title, sub };
}

const DAY = 86_400_000;
const startMs = (d: string) => Date.parse(`${d}T00:00:00+01:00`);
const endMs = (d: string) => Date.parse(`${d}T23:59:59+01:00`);

/** The event that owns the site right now (live first, then early access), or null. */
export function currentEvent(nowMs: number, events: readonly SaleEvent[]): { event: SaleEvent; early: boolean } | null {
  const live = events.find((e) => nowMs >= startMs(e.start) && nowMs <= endMs(e.end));
  if (live) return { event: live, early: false };
  const early = events.find((e) => nowMs < startMs(e.start) && nowMs >= startMs(e.start) - e.earlyAccessDays * DAY);
  return early ? { event: early, early: true } : null;
}

/** Theme key and banner copy for a moment in time. Themes switch by themselves as the calendar moves. */
export function bannerFor(nowMs: number, events: readonly SaleEvent[]): EventTheme {
  const cur = currentEvent(nowMs, events);
  if (!cur) return THEMES.everyday;
  const { event, early } = cur;
  return { key: event.theme, kicker: early ? `${event.kicker} · EARLY ACCESS` : event.kicker, title: event.title, sub: event.sub };
}

export const themeFor = (nowMs: number, events: readonly SaleEvent[]): ThemeKey => bannerFor(nowMs, events).key;

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
