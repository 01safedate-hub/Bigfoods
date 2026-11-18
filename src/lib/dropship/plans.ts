/** Seller plans. Mirrors public.plan_rules() in the database, which enforces them. */
export type PlanKey = "free" | "pro" | "elite";
export type ThemeKey = "studio" | "noir" | "bloom" | "atelier" | "pulse";

export const FREE_SALES_LIMIT = 2_000_000;

export interface Plan {
  key: PlanKey;
  name: string;
  price: number;
  maxProducts: number;
  feePct: number;
  themes: ThemeKey[];
  customDomain: boolean;
  perks: string[];
}

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: "free", name: "Free", price: 0, maxProducts: 20, feePct: 5, themes: ["studio"], customDomain: false,
    perks: ["20 products", "Studio theme", "yourname.fastchina.store", "Up to ₦2,000,000 in sales", "5% fee on your profit"],
  },
  pro: {
    key: "pro", name: "Pro", price: 15_000, maxProducts: 200, feePct: 3, themes: ["studio", "noir", "bloom"], customDomain: true,
    perks: ["200 products", "Noir and Bloom themes", "Your own domain", "No sales limit", "3% fee on your profit"],
  },
  elite: {
    key: "elite", name: "Elite", price: 45_000, maxProducts: 100_000, feePct: 1.5, themes: ["studio", "noir", "bloom", "atelier", "pulse"], customDomain: true,
    perks: ["Unlimited products", "All themes, incl. Atelier and Pulse", "Your own domain", "No sales limit", "1.5% fee on your profit", "Priority support"],
  },
};

export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  plan: PlanKey;
  blurb: string;
  /** Preview swatches: background, text, card. */
  swatch: [string, string, string];
}

export const THEMES: ThemeMeta[] = [
  { key: "studio", name: "Studio", plan: "free", blurb: "Clean white, sharp black type. Lets products speak.", swatch: ["#FFFFFF", "#111111", "#F4F4F4"] },
  { key: "noir", name: "Noir", plan: "pro", blurb: "Black and gold luxury. Made for watches, wigs and evening wear.", swatch: ["#0B0B0C", "#F3EDE1", "#17171A"] },
  { key: "bloom", name: "Bloom", plan: "pro", blurb: "Soft blush, rounded and friendly. Beauty, kids and gifts.", swatch: ["#FFF6F6", "#3B1F2B", "#FFE9EC"] },
  { key: "atelier", name: "Atelier", plan: "elite", blurb: "Editorial magazine layout with big serif headlines.", swatch: ["#F6F1E7", "#1E1A14", "#ECE4D3"] },
  { key: "pulse", name: "Pulse", plan: "elite", blurb: "Loud colour and bold type for gadgets and streetwear.", swatch: ["#101014", "#FFFFFF", "#1C1C24"] },
];

export const themeAllowed = (plan: PlanKey, theme: ThemeKey) => PLANS[plan].themes.includes(theme);

/** The seller's selling price: FastChina's price plus their markup (FastChina's price is never reduced). */
export function storePrice(fastchinaPrice: number, markupType: "pct" | "fixed", markupValue: number): { price: number; markup: number } {
  const raw = markupType === "pct" ? (fastchinaPrice * Math.min(Math.max(markupValue, 0), 300)) / 100 : Math.min(Math.max(markupValue, 0), 5_000_000);
  // Round the selling price up to a tidy ₦100.
  const price = Math.ceil((fastchinaPrice + raw) / 100) * 100;
  return { price, markup: price - fastchinaPrice };
}

/** What the seller keeps from one sale after the plan's fee. Matches the database's store_earnings view. */
export const sellerNet = (markup: number, plan: PlanKey) => markup - Math.round((markup * PLANS[plan].feePct) / 100);

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
export const RESERVED = new Set(["www", "admin", "api", "app", "store", "shop", "seller", "sellers", "mail", "help", "support", "fastchina", "static", "assets"]);
export const slugify = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
