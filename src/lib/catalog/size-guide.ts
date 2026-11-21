import { audienceOf } from "./audience";
import type { Product } from "./types";

export type SizeKind = "shoes" | "men-tops" | "men-bottoms" | "women-clothes";

/** One row of a chart. Ranges are body measurements in cm (or foot length for shoes). */
export interface SizeRow { label: string; aliases?: string[]; [measure: string]: string | string[] | [number, number] | number | undefined }

export interface SizeChart {
  kind: SizeKind;
  title: string;
  /** Measurements shown, in order, with the body part they refer to. */
  measures: { key: string; label: string }[];
  /** What the "find my size" step asks for (the first is the deciding one). */
  ask: { key: string; label: string; min: number; max: number; start: number }[];
  rows: SizeRow[];
  /** Other size systems shown alongside the label (shoes only). */
  systems?: { key: "eu" | "uk" | "us"; label: string }[];
  note: string;
}

const r = (a: number, b: number): [number, number] => [a, b];

export const CHARTS: Record<SizeKind, SizeChart> = {
  shoes: {
    kind: "shoes", title: "Shoe sizes",
    measures: [{ key: "foot", label: "Foot length" }],
    ask: [{ key: "foot", label: "Your foot length", min: 21, max: 31, start: 26 }],
    systems: [{ key: "eu", label: "EU" }, { key: "uk", label: "UK" }, { key: "us", label: "US" }],
    rows: [
      { label: "36", eu: "36", uk: "3.5", us: "4", foot: r(22.4, 22.9) },
      { label: "37", eu: "37", uk: "4.5", us: "5", foot: r(23.0, 23.5) },
      { label: "38", eu: "38", uk: "5", us: "6", foot: r(23.6, 24.1) },
      { label: "39", eu: "39", uk: "5.5", us: "6.5", foot: r(24.2, 24.8) },
      { label: "40", eu: "40", uk: "6.5", us: "7.5", foot: r(24.9, 25.4) },
      { label: "41", eu: "41", uk: "7", us: "8", foot: r(25.5, 26.1) },
      { label: "42", eu: "42", uk: "8", us: "9", foot: r(26.2, 26.8) },
      { label: "43", eu: "43", uk: "9", us: "10", foot: r(26.9, 27.4) },
      { label: "44", eu: "44", uk: "9.5", us: "10.5", foot: r(27.5, 28.1) },
      { label: "45", eu: "45", uk: "10.5", us: "11.5", foot: r(28.2, 28.8) },
      { label: "46", eu: "46", uk: "11.5", us: "12.5", foot: r(28.9, 29.4) },
      { label: "47", eu: "47", uk: "12", us: "13", foot: r(29.5, 30.1) },
      { label: "48", eu: "48", uk: "12.5", us: "13.5", foot: r(30.2, 30.7) },
    ],
    note: "Stand on paper, mark your heel and longest toe, and measure the gap. Between sizes? Go one up.",
  },
  "men-tops": {
    kind: "men-tops", title: "Men’s tops and jackets",
    measures: [{ key: "chest", label: "Chest" }, { key: "waist", label: "Waist" }, { key: "height", label: "Height" }],
    ask: [{ key: "chest", label: "Your chest", min: 80, max: 130, start: 98 }, { key: "height", label: "Your height", min: 155, max: 200, start: 175 }],
    rows: [
      { label: "S", chest: r(88, 94), waist: r(74, 80), height: r(165, 170) },
      { label: "M", chest: r(95, 100), waist: r(81, 86), height: r(170, 175) },
      { label: "L", chest: r(101, 105), waist: r(87, 90), height: r(175, 180) },
      { label: "XL", chest: r(106, 110), waist: r(91, 96), height: r(180, 185) },
      { label: "XXL", aliases: ["2XL"], chest: r(111, 116), waist: r(97, 103), height: r(185, 190) },
      { label: "XXXL", aliases: ["3XL"], chest: r(117, 123), waist: r(104, 109), height: r(190, 195) },
      { label: "4XL", aliases: ["XXXXL"], chest: r(124, 130), waist: r(110, 116), height: r(190, 200) },
    ],
    note: "Chest: measure around the fullest part, under your arms. Chinese sizes run small: if in doubt, choose one size up.",
  },
  "men-bottoms": {
    kind: "men-bottoms", title: "Men’s trousers",
    measures: [{ key: "waist", label: "Waist" }, { key: "hip", label: "Hips" }],
    ask: [{ key: "waist", label: "Your waist", min: 64, max: 110, start: 82 }],
    rows: [
      { label: "28", aliases: ["S"], waist: r(70, 72), hip: r(88, 91) },
      { label: "29", waist: r(73, 75), hip: r(91, 93) },
      { label: "30", aliases: ["M"], waist: r(76, 78), hip: r(93, 96) },
      { label: "31", waist: r(79, 80), hip: r(96, 98) },
      { label: "32", aliases: ["L"], waist: r(81, 83), hip: r(98, 101) },
      { label: "33", waist: r(84, 85), hip: r(101, 103) },
      { label: "34", aliases: ["XL"], waist: r(86, 88), hip: r(103, 106) },
      { label: "36", aliases: ["XXL", "2XL"], waist: r(89, 93), hip: r(106, 111) },
      { label: "38", aliases: ["XXXL", "3XL"], waist: r(94, 98), hip: r(111, 116) },
      { label: "40", aliases: ["4XL"], waist: r(99, 104), hip: r(116, 121) },
    ],
    note: "Waist: measure around your natural waistline, just above the belly button, without pulling tight.",
  },
  "women-clothes": {
    kind: "women-clothes", title: "Women’s clothing",
    measures: [{ key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hips" }],
    ask: [{ key: "bust", label: "Your bust", min: 74, max: 126, start: 90 }, { key: "hip", label: "Your hips", min: 82, max: 130, start: 98 }],
    rows: [
      { label: "XS", bust: r(78, 82), waist: r(60, 64), hip: r(84, 88) },
      { label: "S", bust: r(83, 87), waist: r(65, 69), hip: r(89, 93) },
      { label: "M", bust: r(88, 92), waist: r(70, 74), hip: r(94, 98) },
      { label: "L", bust: r(93, 98), waist: r(75, 80), hip: r(99, 104) },
      { label: "XL", bust: r(99, 104), waist: r(81, 86), hip: r(105, 110) },
      { label: "XXL", aliases: ["2XL"], bust: r(105, 111), waist: r(87, 93), hip: r(111, 117) },
      { label: "XXXL", aliases: ["3XL"], bust: r(112, 118), waist: r(94, 100), hip: r(118, 124) },
    ],
    note: "Bust: around the fullest part. Hips: around the widest part. Fitted styles? Choose by your largest measurement.",
  },
};

const SHOE = /shoe|sneaker|trainer|slipper|sandal|slide|boot|heel|loafer|flip/i;
const BOTTOM = /pant|trouser|jean|chino|jogger|cargo|short|legging/i;
const TOP = /shirt|polo|tee|top|jacket|coat|hoodie|sweater|vest|bomber|blazer/i;

/** Which chart fits a product, or null when sizes don't apply (no size option, or not clothing/shoes). */
export function sizeKindOf(p: Pick<Product, "name" | "category" | "options">): SizeKind | null {
  const hasSize = p.options.some((o) => /size|eu|uk|us\b/i.test(o.name));
  if (!hasSize) return null;
  if (p.category === "shoes" || SHOE.test(p.name)) return "shoes";
  if (p.category !== "fashion") return null;
  const who = audienceOf(p);
  if (who === "women") return "women-clothes";
  if (BOTTOM.test(p.name)) return "men-bottoms";
  if (TOP.test(p.name) || who === "men") return "men-tops";
  return "women-clothes";
}

/** Product size labels, normalised ("EU 42" → "42", "2XL" → "2XL"). */
export function productSizes(p: Pick<Product, "options">): string[] {
  const o = p.options.find((x) => /size|eu|uk|us\b/i.test(x.name));
  return (o?.values ?? []).map((v) => v.label.replace(/^(eu|uk|us)\s*/i, "").replace(/\s*(cm|yards?)$/i, "").trim().toUpperCase());
}

/** Does a chart row match one of the product's size labels? */
export function rowMatches(row: SizeRow, sizes: string[]): boolean {
  const names = [row.label, ...(row.aliases ?? [])].map((x) => x.toUpperCase());
  return sizes.some((s) => names.includes(s));
}

/** The best size for a body measurement: the first row whose range reaches it (or the biggest). */
export function recommend(chart: SizeChart, values: Record<string, number>, sizes?: string[]): SizeRow | null {
  const rows = sizes?.length ? chart.rows.filter((row) => rowMatches(row, sizes)) : chart.rows;
  if (!rows.length) return null;
  let best = 0;
  for (const a of chart.ask) {
    const v = values[a.key];
    if (!Number.isFinite(v)) continue;
    const i = rows.findIndex((row) => (row[a.key] as [number, number])[1] >= v);
    best = Math.max(best, i < 0 ? rows.length - 1 : i);
  }
  return rows[best];
}

export const cmToIn = (cm: number) => Math.round((cm / 2.54) * 10) / 10;
