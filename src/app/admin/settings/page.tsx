import type { Metadata } from "next";
import { FALLBACK_COUPONS } from "@/lib/catalog/coupons";
import { STATIONS } from "@/lib/catalog/stations";
import { type EditorData, getEditorData } from "@/lib/data/admin";
import { FALLBACK_EVENTS } from "@/lib/events";
import { checkStaff } from "@/lib/supabase/auth";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Coupons, events & stations" };

const SAMPLE: EditorData = {
  coupons: FALLBACK_COUPONS.map((c) => ({ id: c.id, label: c.label, title: c.title, rule: c.rule, amount_ngn: c.amount ?? null, percent: c.percent ?? null, max_off_ngn: c.max ?? null, min_spend_ngn: c.minSpend, gadget_only: !!c.gadgetOnly, active: true, ends_at: null })),
  events: FALLBACK_EVENTS.map((e, i) => ({ id: `e${i}`, name: e.name, starts_on: e.start, ends_on: e.end, theme: e.theme, kicker: e.kicker, title: e.title, sub: e.sub, color: e.color, early_access_days: e.earlyAccessDays, active: true })),
  stations: STATIONS.map((s) => ({ ...s, active: true })),
};

export default async function SettingsPage() {
  const s = await checkStaff();
  return <SettingsView data={(s.ok && !s.demo ? await getEditorData() : null) ?? SAMPLE} />;
}
