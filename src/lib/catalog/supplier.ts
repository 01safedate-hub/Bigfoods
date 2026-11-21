import type { SupplierFacts } from "./types";

/** "customized logo, Customized packaging, Graphic customization" -> "Logo, Packaging, Graphic". */
export function customTypesLabel(raw: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.replace(/\bcustomi[sz](ed|ation)\b/gi, "").replace(/\s+/g, " ").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t[0].toUpperCase() + t.slice(1));
  }
  return out.join(", ");
}

/** "Verified supplier · 98% on time · 9 years", or null when there is nothing reassuring to say. */
export function supplierLine(s?: SupplierFacts): string | null {
  if (!s) return null;
  const bits: string[] = [];
  if (s.verified) bits.push("Verified supplier");
  if (s.onTime !== undefined && s.onTime >= 90) bits.push(`${Math.floor(s.onTime)}% on-time delivery`);
  if (s.years !== undefined && s.years >= 2) bits.push(`${s.years} years in business`);
  return bits.length ? bits.join(" · ") : null;
}

/** Whether a customisable order of `qty` pieces meets the factory's minimum. */
export function meetsCustomMinimum(qty: number, moq?: number | null): boolean {
  return !moq || qty >= moq;
}
