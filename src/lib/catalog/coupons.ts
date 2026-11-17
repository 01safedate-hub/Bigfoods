import type { Coupon } from "@/lib/pricing/engine";

export const COUPONS: Coupon[] = [
  { id: "welcome-500", label: "₦500 off", amount: 500, minSpend: 5_000 },
  { id: "save-1500", label: "₦1,500 off", amount: 1_500, minSpend: 15_000 },
  { id: "fashion-10", label: "10% off", percent: 10, max: 2_000, minSpend: 0 },
  { id: "big-5000", label: "₦5,000 off", amount: 5_000, minSpend: 60_000 },
  { id: "gadget-3000", label: "₦3,000 off gadgets", amount: 3_000, minSpend: 250_000, gadgetOnly: true },
];

export const COUPON_COPY: Record<string, { title: string; rule: string }> = {
  "welcome-500": { title: "New customer", rule: "Orders ₦5,000+ · not on gadgets" },
  "save-1500": { title: "Everyday saver", rule: "Orders ₦15,000+ · not on gadgets" },
  "fashion-10": { title: "Fashion week", rule: "Max ₦2,000 off" },
  "big-5000": { title: "Big basket", rule: "Orders ₦60,000+ · not on gadgets" },
  "gadget-3000": { title: "Gadget Hunt", rule: "Phones, laptops & drones ₦250,000+" },
};

/** Best coupon for a cart is picked at checkout; this is the default the UI preselects. */
export const pickBestCoupon = (ids: string[]) => COUPONS.filter((c) => ids.includes(c.id));
