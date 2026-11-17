import { PRICING } from "@/lib/pricing/config";

/** Lagos is UTC+1 all year (no daylight saving), so it is safe to shift by a fixed hour. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A Date whose UTC fields read as Lagos wall-clock time. */
export const lagos = (ms: number) => new Date(ms + LAGOS_OFFSET_MS);

/** UTC ms for a Lagos wall-clock time. */
const fromLagos = (y: number, m: number, d: number, h = 0, min = 0) => Date.UTC(y, m, d, h, min) - LAGOS_OFFSET_MS;

export function midnightDrop(nowMs: number) {
  const [start, end] = PRICING.midnightWindow;
  const l = lagos(nowMs);
  const h = l.getUTCHours();
  const live = h >= start && h < end;
  const y = l.getUTCFullYear();
  const m = l.getUTCMonth();
  const d = l.getUTCDate();
  const next = live ? fromLagos(y, m, d, end) : fromLagos(y, m, d + (h >= start ? 1 : 0), start);
  return { live, msLeft: Math.max(0, next - nowMs) };
}

/** Next Friday 8pm Lagos time: Cart Clear-Out draw. */
export function nextDraw(nowMs: number) {
  const l = lagos(nowMs);
  const y = l.getUTCFullYear();
  const m = l.getUTCMonth();
  const d = l.getUTCDate();
  let add = (5 - l.getUTCDay() + 7) % 7;
  if (add === 0 && l.getUTCHours() >= 20) add = 7;
  return Math.max(0, fromLagos(y, m, d + add, 20) - nowMs);
}

/** Flash sales run in 6-hour blocks. */
export function flashEnds(nowMs: number) {
  const l = lagos(nowMs);
  const blockEnd = (Math.floor(l.getUTCHours() / 6) + 1) * 6;
  return Math.max(0, fromLagos(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate(), blockEnd) - nowMs);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function hms(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function dhm(ms: number) {
  const m = Math.floor(ms / 60_000);
  return { d: Math.floor(m / 1440), h: pad(Math.floor((m % 1440) / 60)), m: pad(m % 60) };
}

export function addDaysLabel(nowMs: number, days: number) {
  return lagos(nowMs + days * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
