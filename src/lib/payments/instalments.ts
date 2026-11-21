/**
 * Pay small small: pay as you go, at 0% interest.
 *
 * - No schedule and no deadlines: the customer pays any amount, any time, from their order page.
 * - The price is locked when the order is placed; we buy from the factory once it's fully paid.
 * - Nothing is bought before then, so an unfinished plan can never cost us money.
 * - Orders must be worth it (at least ₦10,000) and each payment at least ₦1,000 (or what's left).
 */
export const SMALL_SMALL = {
  minOrder: 10_000,
  minPayment: 1_000,
};

/** Can this order total use Pay small small? */
export function canPaySmall(total: number): boolean {
  return Number.isFinite(total) && total >= SMALL_SMALL.minOrder;
}

/** Is this a valid payment towards a plan with `remaining` left? */
export function validPayment(amount: number, remaining: number): boolean {
  if (!Number.isInteger(amount) || amount <= 0 || remaining <= 0) return false;
  return amount <= remaining && (amount >= SMALL_SMALL.minPayment || amount === remaining);
}

/** How far along a plan is, as a whole-number percentage. */
export function progressPct(paid: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((paid / total) * 100)));
}
