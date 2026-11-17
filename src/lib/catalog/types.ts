import type { Costable } from "@/lib/pricing/engine";

export type IconKey =
  | "phone" | "laptop" | "drone" | "watch" | "audio" | "dress" | "shirt" | "wig" | "gem"
  | "lipstick" | "shoe" | "bag" | "home" | "chair" | "sofa" | "table" | "machine" | "kids" | "gift";

export interface QA {
  q: string;
  who: string;
  a?: string;
  by?: string;
}

export interface Product extends Costable {
  slug: string;
  name: string;
  description: string;
  rating: number;
  reviews: number;
  sold: number;
  /** Placeholder tile colour until 1688 photos are synced. */
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
  /** Present when the item is in today's flash sale. */
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
