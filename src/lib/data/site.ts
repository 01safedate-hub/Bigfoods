import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { type CouponCard, FALLBACK_COUPONS } from "@/lib/catalog/coupons";
import { type Station, STATIONS } from "@/lib/catalog/stations";
import { FALLBACK_EVENTS, type SaleEvent, type ThemeKey } from "@/lib/events";
import { hasSupabase } from "@/lib/supabase/env";
import { publicDb } from "@/lib/supabase/server";

export interface SiteData {
  coupons: CouponCard[];
  stations: Station[];
  events: SaleEvent[];
}

/** Coupons, pickup stations and the sale calendar: small lists every shop page needs. */
export async function getSiteData(): Promise<SiteData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("site");
  if (!hasSupabase) return { coupons: FALLBACK_COUPONS, stations: [...STATIONS], events: FALLBACK_EVENTS };
  const db = publicDb();
  const [c, s, e] = await Promise.all([
    db.from("coupons").select("id, label, title, rule, amount_ngn, percent, max_off_ngn, min_spend_ngn, gadget_only").order("sort"),
    db.from("pickup_stations").select("id, state, area, name, hours, address, lat, lng").eq("active", true).eq("verified", true).order("state").order("sort"),
    db.from("sale_events").select("name, starts_on, ends_on, theme, color, kicker, title, sub, early_access_days").order("starts_on"),
  ]);
  const err = c.error ?? s.error ?? e.error;
  if (err) throw new Error(`Site data: ${err.message}`);
  return {
    coupons: (c.data ?? []).map((r) => ({
      id: r.id, label: r.label, title: r.title, rule: r.rule,
      amount: r.amount_ngn ?? undefined, percent: r.percent ?? undefined, max: r.max_off_ngn ?? undefined,
      minSpend: r.min_spend_ngn, gadgetOnly: r.gadget_only,
    })),
    stations: (s.data ?? []).map((r) => ({
      id: r.id, state: r.state, area: r.area, name: r.name, hours: r.hours ?? "", address: r.address,
      lat: r.lat === null ? null : Number(r.lat), lng: r.lng === null ? null : Number(r.lng), verified: true,
    })),
    events: (e.data ?? []).map((r) => ({
      name: r.name, start: r.starts_on, end: r.ends_on, theme: r.theme as ThemeKey, color: r.color,
      kicker: r.kicker, title: r.title, sub: r.sub, earlyAccessDays: r.early_access_days,
    })),
  };
}
