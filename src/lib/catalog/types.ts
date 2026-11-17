import type { CategoryKey, Costable } from "@/lib/pricing/engine";

export type IconKey =
  | "phone" | "laptop" | "drone" | "watch" | "audio" | "dress" | "shirt" | "wig" | "gem"
  | "lipstick" | "shoe" | "bag" | "home" | "chair" | "sofa" | "table" | "machine" | "kids" | "gift";

export interface QA {
  q: string;
  who: string;
  a?: string;
  by?: string;
}

/** Selling prices in naira. This is all the browser ever gets: no costs, margins or suppliers. */
export interface PriceSet {
  list: number;
  midnight: number;
  event: number;
  flash: number;
  retailer: number;
}

export interface Variant {
  id: string;
  /** e.g. { Colour: "Wine", Size: "M" } */
  props: Record<string, string>;
  image?: string | null;
  stock: number;
  prices: PriceSet;
}

export interface ProductOption {
  name: string;
  values: { label: string; hex?: string }[];
}

/** A product as the storefront sees it. */
export interface Product {
  slug: string;
  name: string;
  description: string;
  category: CategoryKey;
  isGadget: boolean;
  shipMode: "air" | "sea";
  images: string[];
  /** Placeholder tile colour and icon until photos are synced. */
  tint: string;
  icon: IconKey;
  rating: number;
  reviews: number;
  sold: number;
  badge?: string;
  isNew?: boolean;
  specs: [string, string][];
  options: ProductOption[];
  variants: Variant[];
  /** Lowest prices across variants. */
  prices: PriceSet;
  qa?: QA[];
  flash?: { claimedPct: number };
}

/** Sample source data with 1688 costs (server-side only in production). */
export interface SampleProduct extends Costable {
  slug: string;
  name: string;
  description: string;
  rating: number;
  reviews: number;
  sold: number;
  tint: string;
  icon: IconKey;
  badge?: string;
  isNew?: boolean;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  /** Variants that change the 1688 cost (e.g. phone storage). */
  options?: { label: string; cny: number }[];
  specs: [string, string][];
  qa?: QA[];
  flash?: { claimedPct: number };
}

export interface Category {
  slug: string;
  name: string;
  icon: IconKey;
  tint: string;
  /** Shown above the tiles when the category has special rules. */
  note?: { text: string; tone: "sea" | "retail" | "plain" };
  tiles: { name: string; icon: IconKey; tint: string }[];
}
