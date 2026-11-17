/**
 * Group pay links: friends and family chip in towards one order.
 *
 * - Items are funded in the organiser's order (top first). The moment an item is
 *   fully covered it is released to purchasing, so paid items ship first.
 * - A contribution is capped at what's still needed, so a link can never be over-paid.
 *   Small amounts (under ₦500) are refused unless they finish the order.
 * - Links stay open for 7 days. At expiry, money that fully covered items is kept for
 *   those items; money left over (not enough for the next item) is returned to the
 *   people who gave it, in proportion to what each gave, to the exact naira.
 */
export const GROUP = { expiryDays: 7, minContribution: 500 };
const DAY = 86_400_000;

export interface LinkItem {
  id: string;
  amount: number;
}
export interface Contribution {
  id: string;
  amount: number;
}

/** Splits money raised across items in order (top first). */
export function allocate(prices: number[], funded: number): number[] {
  let left = funded;
  return prices.map((p) => {
    const got = Math.max(0, Math.min(p, left));
    left -= got;
    return got;
  });
}

export type Accept = { ok: true; accepted: number } | { ok: false; reason: string };

/** How much of a new contribution the link accepts. */
export function acceptContribution(target: number, raised: number, amount: number, nowMs: number, createdMs: number): Accept {
  if (nowMs >= createdMs + GROUP.expiryDays * DAY) return { ok: false, reason: "This link has closed." };
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: "Enter an amount in naira." };
  const needed = target - raised;
  if (needed <= 0) return { ok: false, reason: "This order is fully paid. Thank you!" };
  const accepted = Math.min(amount, needed);
  if (accepted < GROUP.minContribution && accepted < needed) return { ok: false, reason: `The smallest contribution is ₦${GROUP.minContribution}.` };
  return { ok: true, accepted };
}

/** Splits `pool` across contributors in proportion to what they gave (largest remainder, exact to ₦1). */
export function proRata(pool: number, contributions: Contribution[]): Map<string, number> {
  const total = contributions.reduce((s, c) => s + c.amount, 0);
  const out = new Map<string, number>();
  if (pool <= 0 || total <= 0) return out;
  const shares = contributions.map((c) => {
    const exact = (pool * c.amount) / total;
    return { id: c.id, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let left = pool - shares.reduce((s, x) => s + x.floor, 0);
  for (const s of [...shares].sort((a, b) => b.frac - a.frac)) {
    const extra = left > 0 ? 1 : 0;
    left -= extra;
    out.set(s.id, (out.get(s.id) ?? 0) + s.floor + extra);
  }
  return out;
}

export interface LinkState {
  open: boolean;
  raised: number;
  allocation: number[];
  /** Items fully covered, in order: these go to purchasing now. */
  released: string[];
  /** At expiry only: money that didn't complete an item, and who gets it back. */
  leftover: number;
  refunds: Map<string, number>;
}

export function linkState(items: LinkItem[], contributions: Contribution[], nowMs: number, createdMs: number): LinkState {
  const raised = contributions.reduce((s, c) => s + c.amount, 0);
  const allocation = allocate(items.map((i) => i.amount), raised);
  const released = items.filter((it, k) => allocation[k] === it.amount).map((i) => i.id);
  const open = nowMs < createdMs + GROUP.expiryDays * DAY && released.length < items.length;
  const usedByReleased = items.reduce((s, it, k) => s + (allocation[k] === it.amount ? it.amount : 0), 0);
  const leftover = open ? 0 : raised - usedByReleased;
  return { open, raised, allocation, released, leftover, refunds: proRata(leftover, contributions) };
}
