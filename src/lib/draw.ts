/**
 * Cart Clear-Out: every Friday we pay for a few random carts.
 *
 * Fair:  On Monday we publish sha256(seed). On Friday we reveal the seed. Each entry's
 *        ticket is sha256(seed + ":" + entryId); lowest tickets win. Anyone can re-run it.
 * Safe:  The week's budget is 5% of last week's real profit, capped at ₦500,000,
 *        and zero after a week without profit. Winners are taken in ticket order while
 *        their cart fits the budget left, so the draw can never cost more than the budget.
 * Rules: Carts of ₦20,000+ kept for at least 24 hours before the draw; one entry per customer;
 *        at most 5 winners.
 */
export const DRAW = { minCart: 20_000, minHoldHours: 24, profitShare: 0.05, budgetCap: 500_000, maxWinners: 5 };

export interface Entry {
  id: string;
  customerId: string;
  cartTotal: number;
  heldSinceMs: number;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** What we publish on Monday. */
export const commitment = (seedHex: string) => sha256Hex(seedHex);

export const budgetFor = (lastWeekProfit: number) => (lastWeekProfit > 0 ? Math.min(DRAW.budgetCap, Math.floor(lastWeekProfit * DRAW.profitShare)) : 0);

export function eligible(entries: Entry[], drawAtMs: number): Entry[] {
  const seen = new Set<string>();
  return entries
    .filter((e) => e.cartTotal >= DRAW.minCart && e.heldSinceMs <= drawAtMs - DRAW.minHoldHours * 3_600_000)
    .sort((a, b) => a.heldSinceMs - b.heldSinceMs)
    .filter((e) => !seen.has(e.customerId) && (seen.add(e.customerId), true));
}

export interface DrawResult {
  winners: Entry[];
  spent: number;
  tickets: { id: string; ticket: string }[];
}

export async function runDraw(seedHex: string, entries: Entry[], budget: number): Promise<DrawResult> {
  const tickets = await Promise.all(entries.map(async (e) => ({ e, ticket: await sha256Hex(`${seedHex}:${e.id}`) })));
  tickets.sort((a, b) => (a.ticket < b.ticket ? -1 : a.ticket > b.ticket ? 1 : 0));
  const winners: Entry[] = [];
  let spent = 0;
  for (const { e } of tickets) {
    if (winners.length >= DRAW.maxWinners) break;
    if (spent + e.cartTotal <= budget) {
      winners.push(e);
      spent += e.cartTotal;
    }
  }
  return { winners, spent, tickets: tickets.map((t) => ({ id: t.e.id, ticket: t.ticket })) };
}

/** Verifies a published draw: the seed matches Monday's commitment and the winners follow from it. */
export async function verifyDraw(seedHex: string, published: string, entries: Entry[], budget: number, winnerIds: string[]) {
  if ((await commitment(seedHex)) !== published) return false;
  const r = await runDraw(seedHex, entries, budget);
  return r.winners.map((w) => w.id).join() === winnerIds.join();
}
