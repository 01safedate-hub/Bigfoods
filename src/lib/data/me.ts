import type { ItemCustom } from "@/app/(shop)/account/orders/custom-artwork";
import "server-only";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";

export const ORDER_GROUPS = {
  unpaid: { label: "Unpaid", statuses: ["awaiting_payment", "part_paid"] },
  processing: { label: "Processing", statuses: ["paid", "purchasing", "purchased", "at_warehouse"] },
  shipped: { label: "Shipped", statuses: ["shipped"] },
  review: { label: "Review", statuses: ["delivered"] },
  returns: { label: "Returns", statuses: ["cancelled", "refunded"] },
} as const;
export type OrderGroup = keyof typeof ORDER_GROUPS;

export interface MyOrder {
  code: string;
  status: string;
  pay_mode: string;
  total_ngn: number;
  paid_ngn: number;
  created_at: string;
  items: { id: string; title: string; variant_label: string | null; qty: number; customisable: boolean; custom: ItemCustom | null; customMoq: number | null; productSlug: string | null }[];
}

export interface Me {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  role: string;
  station: { id: string; name: string; area: string; state: string; verified: boolean } | null;
  wallet: number;
  points: number;
  saved: number;
  counts: Record<OrderGroup, number>;
  orders: MyOrder[];
}

/** Everything the profile screen shows, read as the customer (row level security returns only their own rows). */
export async function getMe(): Promise<Me | null> {
  if (!hasSupabase) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const db = await userDb();
  const [profile, bal, wish, orders] = await Promise.all([
    db.from("profiles").select("full_name, phone, role, station_id").eq("id", user.id).maybeSingle(),
    db.from("my_balances").select("wallet_ngn, points").maybeSingle(),
    db.from("wishlists").select("product_id", { count: "exact", head: true }),
    db.from("orders").select("code, status, pay_mode, total_ngn, paid_ngn, created_at, order_items(id, title, variant_label, qty, product_skus(products(slug, customisable, custom_moq)), order_customisations(id, status, quote_ngn, staff_note, files))").order("created_at", { ascending: false }).limit(50),
  ]);
  const p = profile.data;
  let station: Me["station"] = null;
  if (p?.station_id) {
    const { data } = await db.from("pickup_stations").select("id, name, area, state, verified").eq("id", p.station_id).maybeSingle();
    station = data ?? null;
  }
  type RawItem = Omit<MyOrder["items"][number], "customisable" | "custom" | "customMoq" | "productSlug"> & { product_skus: { products: { slug: string; customisable: boolean; custom_moq: number | null } | null } | null; order_customisations: ItemCustom[] | ItemCustom | null };
  const list = ((orders.data ?? []) as unknown as (Omit<MyOrder, "items"> & { order_items: RawItem[] })[]).map(({ order_items, ...o }) => ({
    ...o,
    items: (order_items ?? []).map(({ product_skus, order_customisations, ...i }) => ({
      ...i,
      customisable: product_skus?.products?.customisable === true,
      customMoq: product_skus?.products?.custom_moq ?? null,
      productSlug: product_skus?.products?.slug ?? null,
      custom: Array.isArray(order_customisations) ? (order_customisations[0] ?? null) : order_customisations,
    })),
  }));
  const counts = Object.fromEntries(
    (Object.keys(ORDER_GROUPS) as OrderGroup[]).map((g) => [g, list.filter((o) => (ORDER_GROUPS[g].statuses as readonly string[]).includes(o.status)).length]),
  ) as Record<OrderGroup, number>;
  return {
    id: user.id,
    email: user.email,
    name: p?.full_name || user.email?.split("@")[0] || "FastChina customer",
    phone: p?.phone ?? user.phone,
    role: p?.role ?? "customer",
    station,
    wallet: bal.data?.wallet_ngn ?? 0,
    points: bal.data?.points ?? 0,
    saved: wish.count ?? 0,
    counts,
    orders: list,
  };
}
