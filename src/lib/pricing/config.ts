/**
 * Pricing settings. In production these live in the `pricing_settings` table and are
 * edited from Admin → Pricing rules. The database prices every SKU with the same numbers
 * (price_sku), so the storefront and the backend always agree.
 */
export const PRICING = {
  /** Our dollar rate. */
  nairaPerUsd: 2100,
  /** Market yuan per dollar (16 Nov 2026). Refreshed daily; prices reprice if it moves > 1.5%. */
  cnyPerUsd: 6.6664,
  /** Air freight China → Lagos. Assumed until the real rate is set. */
  airPerKg: 15_000,
  /** Customs clearing per kilogram: air cargo. */
  clearingPerKg: 1_800,
  /** Customs clearing per kilogram: sea cargo. */
  seaClearingPerKg: 1_500,
  /** Standard weighing/handling fee on every item, retail and wholesale. */
  weighingFeePerItem: 200,
  /** For sea freight, volume is at least weight ÷ this (kg per cubic metre). */
  seaKgPerCbm: 250,
  /** Safety margin on estimated sea freight and clearing for wholesale. */
  seaBuffer: 0.1,
  /** Local delivery to the pickup station, by item weight (bulky ≥0.1 CBM pays the top fee). */
  localDeliveryTiers: [
    { maxKg: 0.25, fee: 400 }, { maxKg: 1, fee: 700 }, { maxKg: 3, fee: 1_000 }, { maxKg: 10, fee: 1_500 }, { maxKg: null, fee: 2_000 },
  ] as readonly { maxKg: number | null; fee: number }[],
  /** Wholesale minimum per product (all variants together). */
  wholesaleMinQty: 10,
  /** Sea freight per cubic metre. Assumed until the real rate is set. */
  seaPerCbm: 420_000,
  /** Payment processor fee: pct% + flat (flat waived under flatFrom), capped. */
  paymentFee: { pct: 1.5, flat: 100, flatFrom: 2_500, cap: 2_000 },
  /** Phones, laptops, desktops and drones: 10% + ₦50,000. */
  gadget: { pct: 0.1, flat: 50_000 },
  /** Share of planned profit each price promotion gives away. */
  promos: { midnight: 0.2, event: 0.3, flash: 0.5, retailer: 0.4 },
  guardrails: {
    /** All discounts on an order together never exceed this share of its planned profit. */
    maxDiscountShareOfProfit: 0.5,
    /** A coupon never exceeds this share of the eligible items' planned profit. */
    maxCouponShareOfProfit: 0.25,
    /** Points can pay at most this share of the order. */
    maxPointsShareOfOrder: 0.1,
  },
  retailerMinQty: 10,
  /** Midnight Drop window in Lagos time, [start, end) hours. */
  midnightWindow: [0, 4] as const,
} as const;

/** ₦ per ¥1, the standard rate: ₦2,100/$ ÷ ¥6.6664/$ ≈ ₦315. */
export const NAIRA_PER_CNY = Math.round(PRICING.nairaPerUsd / PRICING.cnyPerUsd);
