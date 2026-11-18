import "server-only";
import type { PlanKey, ThemeKey } from "@/lib/dropship/plans";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";

export interface SellerDashboard {
  store: {
    id: string; slug: string; name: string; tagline: string | null; accent: string; theme: ThemeKey; plan: PlanKey;
    plan_renews_at: string | null; status: "active" | "needs_upgrade" | "suspended"; lifetime_sales: number;
    custom_domain: string | null; domain_verified: boolean; has_bank: boolean;
  };
  products: number;
  sales_30d: number; orders_30d: number; profit_30d: number; visits_30d: number;
  earnings: { pending: number; available: number; paid: number };
  daily: { d: string; sales: number; visits: number }[];
  recent: { code: string; status: string; total_ngn: number; created_at: string; state: string; profit: number }[];
  top: { title: string; units: number; profit: number }[];
}

const day = (i: number) => new Date(Date.UTC(2026, 9, 20 + i)).toISOString().slice(0, 10);
const SALES = [0, 22, 0, 31, 28, 0, 57, 44, 0, 61, 38, 73, 0, 52, 88, 41, 66, 0, 97, 75, 58, 112, 84, 0, 131, 96, 77, 143, 118, 160];

export const SAMPLE_DASHBOARD: SellerDashboard = {
  store: { id: "demo", slug: "adas-closet", name: "Ada’s Closet", tagline: "Lagos girls, Lagos prices.", accent: "#C2410C", theme: "studio", plan: "free", plan_renews_at: null, status: "active", lifetime_sales: 1_386_400, custom_domain: null, domain_verified: false, has_bank: true },
  products: 14,
  sales_30d: 1_934_000, orders_30d: 61, profit_30d: 362_300, visits_30d: 4_812,
  earnings: { pending: 118_400, available: 74_900, paid: 169_000 },
  daily: SALES.map((k, i) => ({ d: day(i), sales: k * 1_000, visits: 90 + ((i * 37) % 120) + k })),
  recent: [
    { code: "B7D0013F", status: "paid", total_ngn: 28_700, created_at: "2026-11-18T08:41:00Z", state: "Lagos", profit: 5_510 },
    { code: "4C19AE02", status: "shipped", total_ngn: 109_200, created_at: "2026-11-17T19:12:00Z", state: "FCT Abuja", profit: 20_710 },
    { code: "737012B0", status: "delivered", total_ngn: 35_400, created_at: "2026-11-16T14:03:00Z", state: "Rivers", profit: 6_700 },
    { code: "91AE77C2", status: "purchasing", total_ngn: 19_000, created_at: "2026-11-16T09:30:00Z", state: "Lagos", profit: 3_610 },
    { code: "0FD2B811", status: "awaiting_payment", total_ngn: 61_900, created_at: "2026-11-15T21:55:00Z", state: "Oyo", profit: 0 },
  ],
  top: [
    { title: "Satin cowl-neck midi dress", units: 23, profit: 126_960 },
    { title: "Body wave lace front wig, 22\"", units: 9, profit: 103_270 },
    { title: "Quilted crossbody chain bag", units: 14, profit: 66_920 },
    { title: "Matte liquid lipstick set", units: 19, profit: 31_900 },
  ],
};

export type SellerState = { kind: "demo"; data: SellerDashboard } | { kind: "signed-out" } | { kind: "no-store" } | { kind: "live"; data: SellerDashboard };

/** The signed-in seller's dashboard, or what to show instead. */
export async function getSeller(): Promise<SellerState> {
  if (!hasSupabase) return { kind: "demo", data: SAMPLE_DASHBOARD };
  const user = await getSessionUser();
  if (!user) return { kind: "signed-out" };
  const { data } = await (await userDb()).rpc("seller_dashboard");
  return data ? { kind: "live", data: data as SellerDashboard } : { kind: "no-store" };
}

export interface SellerOrderRow { code: string; status: string; created_at: string; state: string; items: { title: string; variant: string | null; qty: number }[]; profit: number; bucket: string }

export async function getSellerOrders(): Promise<SellerOrderRow[] | null> {
  if (!hasSupabase) return null;
  const { data } = await (await userDb()).from("store_earnings").select("order_id, code, status, created_at, state, title, variant_label, qty, net_ngn, bucket").order("created_at", { ascending: false }).limit(300);
  const byOrder = new Map<string, SellerOrderRow>();
  for (const r of data ?? []) {
    const o: SellerOrderRow = byOrder.get(r.order_id) ?? { code: r.code, status: r.status, created_at: r.created_at, state: r.state, items: [], profit: 0, bucket: r.bucket };
    o.items.push({ title: r.title, variant: r.variant_label, qty: r.qty });
    if (r.bucket !== "void") o.profit += r.net_ngn;
    byOrder.set(r.order_id, o);
  }
  return [...byOrder.values()];
}

export interface Payout { id: string; amount_ngn: number; items: number; status: string; created_at: string; paid_at: string | null }

export async function getPayouts(): Promise<{ payouts: Payout[]; bank: { bank_name: string | null; account_number: string | null; account_name: string | null } } | null> {
  if (!hasSupabase) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const db = await userDb();
  const [{ data: payouts }, { data: bank }] = await Promise.all([
    db.from("seller_payouts").select("id, amount_ngn, items, status, created_at, paid_at").order("created_at", { ascending: false }).limit(50),
    db.from("stores").select("bank_name, account_number, account_name").eq("owner_id", user.id).maybeSingle(),
  ]);
  return { payouts: (payouts ?? []) as Payout[], bank: bank ?? { bank_name: null, account_number: null, account_name: null } };
}
