import type { PriceSet } from "@/lib/catalog/types";
import { NAIRA_PER_CNY, PRICING } from "./config";
import { unitFromPrices } from "./prices";

export type CategoryKey =
  | "fashion"
  | "hair"
  | "beauty"
  | "jewellery"
  | "audio"
  | "shoes"
  | "bags"
  | "home"
  | "kids"
  | "furniture"
  | "machines"
  | "gadgets";

/** Target profit on the goods cost, by category. Gadgets use the fixed rule instead. */
export const CATEGORY_MARGIN: Record<CategoryKey, number> = {
  fashion: 0.8,
  hair: 0.7,
  beauty: 0.9,
  jewellery: 0.9,
  audio: 0.9,
  shoes: 0.75,
  bags: 0.85,
  home: 0.8,
  kids: 0.8,
  furniture: 0.6,
  machines: 0.6,
  gadgets: 0,
};

/** Categories that may only travel by sea. */
export const SEA_ONLY: ReadonlySet<CategoryKey> = new Set(["furniture", "machines"]);

export interface Costable {
  cny: number;
  weightKg: number;
  /** Required for sea items. */
  cbm?: number;
  category: CategoryKey;
}

export type PricePromo = "none" | "midnight" | "event" | "flash";

export const roundUp100 = (n: number) => Math.ceil(n / 100) * 100;

export function paymentFee(amount: number): number {
  if (amount <= 0) return 0;
  const { pct, flat, flatFrom, cap } = PRICING.paymentFee;
  return Math.min(cap, (amount * pct) / 100 + (amount >= flatFrom ? flat : 0));
}

export const isGadget = (p: Costable) => p.category === "gadgets";
export const shipsBySea = (p: Costable) => SEA_ONLY.has(p.category);

export interface PriceBreakdown {
  goods: number;
  logistics: number;
  lastMile: number;
  plannedProfit: number;
  /** Everything we pay out per item, before the payment fee. */
  cost: number;
  list: number;
  midnight: number;
  event: number;
  flash: number;
  retailer: number;
}

/**
 * Profit is charged on the goods cost only. Freight, clearing and last-mile
 * pass through at cost, so light cheap items stay competitive.
 */
export function priceOf(p: Costable): PriceBreakdown {
  const goods = p.cny * NAIRA_PER_CNY;
  const logistics = shipsBySea(p)
    ? (p.cbm ?? 0) * PRICING.seaPerCbm + p.weightKg * PRICING.clearingPerKg
    : p.weightKg * (PRICING.airPerKg + PRICING.clearingPerKg);
  const lastMile = PRICING.lastMilePerItem;
  const plannedProfit = isGadget(p)
    ? goods * PRICING.gadget.pct + PRICING.gadget.flat
    : goods * CATEGORY_MARGIN[p.category];
  const cost = goods + logistics + lastMile;
  const at = (share: number) => {
    const preFee = cost + plannedProfit * (1 - share);
    return roundUp100(preFee + paymentFee(preFee));
  };
  return {
    goods,
    logistics,
    lastMile,
    plannedProfit,
    cost,
    list: at(0),
    midnight: at(PRICING.promos.midnight),
    event: at(PRICING.promos.event),
    flash: at(PRICING.promos.flash),
    retailer: at(PRICING.promos.retailer),
  };
}

/** Unit price for a quantity under the active price promotion (from costs; server and tests). */
export function unitPrice(p: Costable, qty: number, promo: PricePromo): number {
  return unitFromPrices(priceOf(p), qty, promo);
}

export interface Coupon {
  id: string;
  label: string;
  /** Fixed naira off, or a percentage with a maximum. */
  amount?: number;
  percent?: number;
  max?: number;
  minSpend: number;
  /** Only gadget coupons apply to gadgets; normal coupons skip them. */
  gadgetOnly?: boolean;
}

/** One cart line as the server prices it: selling prices plus the costs only the server knows. */
export interface QuoteLine {
  prices: PriceSet;
  cost: number;
  plannedProfit: number;
  gadget: boolean;
  qty: number;
}

/** Build a quote line from 1688 costs (sample data, admin tools and tests). */
export function lineFromCosts(product: Costable, qty: number): QuoteLine {
  const b = priceOf(product);
  return { prices: b, cost: b.cost, plannedProfit: b.plannedProfit, gadget: isGadget(product), qty };
}

export interface CartQuote {
  subtotalList: number;
  subtotal: number;
  priceSavings: number;
  coupon: number;
  couponNote?: string;
  points: number;
  total: number;
  plannedProfit: number;
  profitKept: number;
  /** Discount the customer asked for that the guardrails refused. */
  refused: number;
}

/**
 * Prices a cart and enforces every guardrail. Used by checkout and by the
 * admin profit check; the edge function runs the same code server-side.
 */
export function quoteCart(
  lines: QuoteLine[],
  opts: { promo?: PricePromo; coupon?: Coupon | null; pointsNaira?: number } = {},
): CartQuote {
  const promo = opts.promo ?? "none";
  const g = PRICING.guardrails;
  let subtotalList = 0;
  let subtotal = 0;
  let plannedProfit = 0;
  let cost = 0;
  let eligibleSubtotal = 0;
  let eligibleProfit = 0;
  const coupon = opts.coupon ?? null;

  for (const line of lines) {
    const { qty } = line;
    const unit = unitFromPrices(line.prices, qty, promo);
    subtotalList += line.prices.list * qty;
    subtotal += unit * qty;
    plannedProfit += line.plannedProfit * qty;
    cost += line.cost * qty;
    const retail = qty >= PRICING.retailerMinQty;
    const fits = coupon ? (coupon.gadgetOnly ? line.gadget : !line.gadget) : false;
    if (!retail && fits) {
      eligibleSubtotal += unit * qty;
      eligibleProfit += line.plannedProfit * qty;
    }
  }

  const priceSavings = subtotalList - subtotal;
  const room = Math.max(0, g.maxDiscountShareOfProfit * plannedProfit - priceSavings);

  let couponWanted = 0;
  let couponNote: string | undefined;
  if (coupon) {
    if (eligibleSubtotal === 0) couponNote = coupon.gadgetOnly ? "Only applies to gadgets" : "No eligible items (gadgets and 10+ retailer items are excluded)";
    else if (eligibleSubtotal < coupon.minSpend) couponNote = `Spend ₦${(coupon.minSpend - eligibleSubtotal).toLocaleString("en-NG")} more on eligible items`;
    else couponWanted = coupon.amount ?? Math.min(coupon.max ?? Infinity, (eligibleSubtotal * (coupon.percent ?? 0)) / 100);
  }
  const couponGiven = Math.min(couponWanted, g.maxCouponShareOfProfit * eligibleProfit, room);
  if (couponGiven < couponWanted && !couponNote) couponNote = "Reduced to keep the deal fair for everyone";

  const pointsWanted = Math.min(opts.pointsNaira ?? 0, g.maxPointsShareOfOrder * (subtotal - couponGiven));
  const pointsGiven = Math.min(pointsWanted, Math.max(0, room - couponGiven));

  const total = Math.round(subtotal - couponGiven - pointsGiven);
  const profitKept = total - cost - paymentFee(total);

  return {
    subtotalList,
    subtotal,
    priceSavings,
    coupon: Math.round(couponGiven),
    couponNote,
    points: Math.round(pointsGiven),
    total,
    plannedProfit,
    profitKept,
    refused: Math.round(couponWanted - couponGiven + (opts.pointsNaira ? Math.min(opts.pointsNaira, g.maxPointsShareOfOrder * (subtotal - couponGiven)) - pointsGiven : 0)),
  };
}
