/**
 * Order lifecycle. The database enforces the same transitions with a trigger
 * (migration 008), so the admin screens and automations can't skip a step.
 *
 *   awaiting_payment ─▶ part_paid ─▶ paid ─▶ purchasing ─▶ purchased ─▶ at_warehouse ─▶ shipped ─▶ delivered
 *          │               │          │          │                                          │
 *          └───────────────┴──────────┴──────────┴──▶ cancelled                             └──▶ refunded
 *
 * Rules:
 * - Nothing is bought from the supplier until the order is fully paid (Pay small small and Group pay included).
 * - Cancelling is allowed until we have bought the item; after that the money is committed.
 * - "Shipped" flips to "delivered" automatically 10 days later (the scheduled job in migration 008).
 * - A shipped order that never reaches the pickup station is refunded in full.
 */
export const ORDER_STATUSES = [
  "awaiting_payment", "part_paid", "paid", "purchasing", "purchased", "at_warehouse", "shipped", "delivered", "cancelled", "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  awaiting_payment: ["part_paid", "paid", "cancelled"],
  part_paid: ["paid", "cancelled"],
  paid: ["purchasing", "cancelled"],
  purchasing: ["purchased", "cancelled"],
  purchased: ["at_warehouse"],
  at_warehouse: ["shipped"],
  shipped: ["delivered", "refunded"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const canMove = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);

/** Moves along the happy path, refusing illegal jumps. */
export function move(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!canMove(from, to)) throw new Error(`Order can't go from ${from} to ${to}`);
  return to;
}

export const AUTO_DELIVER_DAYS = 10;
const DAY = 86_400_000;

export const autoDeliverDue = (shippedAtMs: number, nowMs: number) => nowMs - shippedAtMs >= AUTO_DELIVER_DAYS * DAY;

/** Customer-facing step for a status (the tracking bar). */
export function trackingStep(status: OrderStatus): { step: number; of: number; label: string } {
  const steps: [OrderStatus[], string][] = [
    [["awaiting_payment", "part_paid"], "Waiting for payment"],
    [["paid", "purchasing"], "Ordering from the factory"],
    [["purchased", "at_warehouse"], "At our China warehouse · photo check"],
    [["shipped"], "On the way to your pickup station"],
    [["delivered"], "Ready at your pickup station"],
  ];
  const i = steps.findIndex(([s]) => s.includes(status));
  if (i === -1) return { step: 0, of: steps.length, label: status === "refunded" ? "Refunded" : "Cancelled" };
  return { step: i + 1, of: steps.length, label: steps[i][1] };
}

/** Arrival window from the day an order is fully paid. Air: 10–18 days. Sea: 90–110 days. */
export function arrivalWindow(mode: "air" | "sea", paidAtMs: number): { from: number; to: number } {
  const [a, b] = mode === "air" ? [10, 18] : [90, 110];
  return { from: paidAtMs + a * DAY, to: paidAtMs + b * DAY };
}

/** Orders mixing air and sea items travel as two shipments, each with its own window. */
export function splitShipments<T extends { shipMode: "air" | "sea" }>(items: T[]) {
  return { air: items.filter((i) => i.shipMode === "air"), sea: items.filter((i) => i.shipMode === "sea") };
}
