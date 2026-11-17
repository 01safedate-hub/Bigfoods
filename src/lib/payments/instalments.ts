/**
 * Pay small small: 0% weekly instalments.
 *
 * - The first payment is taken today and carries the rounding, so every later
 *   payment is a round ₦100 amount and the payments add up to the total exactly.
 * - The price is locked at checkout; we buy from the factory only when the last payment clears.
 * - A payment is "late" after a 3-day grace period. If money is still overdue
 *   14 days after a due date, the plan is cancelled and everything paid so far
 *   goes back to the customer's FastChina wallet (no fee). Nothing was bought,
 *   so this can never cost us money.
 * - Plans must be worth it: at least ₦10,000 and at least ₦2,000 a week.
 */
export const SMALL_SMALL = {
  weekOptions: [4, 8, 12] as const,
  minOrder: 10_000,
  minInstalment: 2_000,
  graceDays: 3,
  cancelAfterDays: 14,
  roundTo: 100,
};

const DAY = 86_400_000;

export interface Instalment {
  n: number;
  dueMs: number;
  amount: number;
}

/** Which plan lengths this order total allows. */
export function planOptions(total: number): number[] {
  if (total < SMALL_SMALL.minOrder) return [];
  return SMALL_SMALL.weekOptions.filter((w) => Math.floor(total / w / SMALL_SMALL.roundTo) * SMALL_SMALL.roundTo >= SMALL_SMALL.minInstalment);
}

export function buildSchedule(total: number, weeks: number, startMs: number): Instalment[] {
  if (!Number.isInteger(total) || total <= 0) throw new Error("Total must be a positive whole naira amount");
  if (!Number.isInteger(weeks) || weeks < 1) throw new Error("Weeks must be a positive whole number");
  const r = SMALL_SMALL.roundTo;
  const base = Math.floor(total / weeks / r) * r;
  const first = total - base * (weeks - 1);
  return Array.from({ length: weeks }, (_, k) => ({ n: k + 1, dueMs: startMs + k * 7 * DAY, amount: k === 0 ? first : base }));
}

export type PlanState = "complete" | "on_track" | "late" | "cancel";

export interface PlanStatus {
  state: PlanState;
  paid: number;
  remaining: number;
  /** Amount that should have been paid by now (due dates passed) but hasn't. */
  overdue: number;
  next: Instalment | null;
  /** When the plan will be cancelled if nothing changes (only while overdue). */
  cancelAtMs: number | null;
}

/** Where a plan stands, given everything paid so far (payments fill instalments in order). */
export function planStatus(schedule: Instalment[], paidTotal: number, nowMs: number): PlanStatus {
  const total = schedule.reduce((s, i) => s + i.amount, 0);
  const paid = Math.min(paidTotal, total);
  if (paid >= total) return { state: "complete", paid, remaining: 0, overdue: 0, next: null, cancelAtMs: null };

  let covered = paid;
  let firstUnpaid: Instalment | null = null;
  let overdue = 0;
  for (const i of schedule) {
    const short = Math.max(0, i.amount - covered);
    covered = Math.max(0, covered - i.amount);
    if (short > 0) {
      firstUnpaid ??= i;
      if (i.dueMs <= nowMs) overdue += short;
    }
  }
  const due = firstUnpaid!.dueMs;
  const cancelAtMs = overdue > 0 ? due + SMALL_SMALL.cancelAfterDays * DAY : null;
  const state: PlanState =
    overdue === 0 ? "on_track" : nowMs >= cancelAtMs! ? "cancel" : nowMs > due + SMALL_SMALL.graceDays * DAY ? "late" : "on_track";
  return { state, paid, remaining: total - paid, overdue, next: firstUnpaid, cancelAtMs };
}
