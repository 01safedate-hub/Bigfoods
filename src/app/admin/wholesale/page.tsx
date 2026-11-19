import type { Metadata } from "next";
import { getWholesaleAdmin, type WholesaleAdmin } from "@/lib/data/admin";
import { PRICING } from "@/lib/pricing/config";
import { checkStaff } from "@/lib/supabase/auth";
import { DEFAULT_KITS } from "@/lib/wholesale/rules";
import { WholesaleAdminView } from "./wholesale-admin";

export const metadata: Metadata = { title: "Wholesale" };

const SAMPLE: WholesaleAdmin = {
  orders: [],
  categories: [["gadgets", "Phones & Gadgets", 0.1], ["fashion", "Fashion", 0.25], ["hair", "Hair & Wigs", 0.2], ["furniture", "Furniture", 0.4]].map(([slug, name, m], i) => ({ id: i + 1, slug: slug as string, name: name as string, wholesale_enabled: true, wholesale_margin: m as number, wholesale_sort: i })),
  kits: DEFAULT_KITS.map((k, i) => ({ id: i + 1, slug: k.slug, title: k.title, subtitle: k.subtitle, tone: k.tone, categories: k.categories, max_products: k.maxProducts, units_each: k.unitsEach, sort: i, active: true })),
  costs: {
    clearing_per_kg: PRICING.clearingPerKg, sea_clearing_per_kg: PRICING.seaClearingPerKg, weighing_fee_per_item: PRICING.weighingFeePerItem, air_per_kg: PRICING.airPerKg,
    sea_per_cbm: PRICING.seaPerCbm, sea_kg_per_cbm: PRICING.seaKgPerCbm, sea_buffer: PRICING.seaBuffer, wholesale_min_qty: PRICING.wholesaleMinQty,
    local_delivery_tiers: PRICING.localDeliveryTiers.map((t) => ({ max_kg: t.maxKg, fee: t.fee })),
  },
};

export default async function WholesaleAdminPage() {
  const s = await checkStaff();
  const data = (s.ok && !s.demo ? await getWholesaleAdmin() : null) ?? SAMPLE;
  return <WholesaleAdminView data={data} />;
}
