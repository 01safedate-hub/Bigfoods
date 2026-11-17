import "server-only";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

export interface PurchaseRow {
  id: string; name: string; variant: string; orders: number; supplier: string; cny: number; need: number; bought: number; ship: "Air" | "Sea";
}
export interface StateRow {
  name: string; orders: number; units: number; ready: number; stations: number; waiting: number;
}
export interface LivePurchasing {
  rows: PurchaseRow[];
  states: StateRow[];
}

/** Live purchase list and dispatch board. Null when the database isn't connected (the screen shows sample data). Call only after a staff check. */
export async function getLivePurchasing(): Promise<LivePurchasing | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  const [p, d] = await Promise.all([
    db.from("purchase_list").select("*").order("title"),
    db.from("dispatch_by_state").select("*").order("state"),
  ]);
  if (p.error ?? d.error) throw new Error(`Purchasing: ${(p.error ?? d.error)!.message}`);
  return {
    rows: (p.data ?? []).map((r) => ({
      id: r.sku_id, name: r.title, variant: (r.variant as string).replaceAll(";", " / ").replace(/[A-Za-z]+:/g, ""), orders: r.orders,
      supplier: r.supplier ?? "—", cny: Number(r.cny_price ?? 0), need: r.need, bought: r.bought, ship: r.ship_mode === "sea" ? "Sea" : "Air",
    })),
    states: (d.data ?? []).map((s) => {
      const total = s.ready + s.waiting;
      return { name: s.state, orders: total, units: s.units, ready: total ? Math.round((s.ready / total) * 100) : 0, stations: s.stations, waiting: s.waiting };
    }),
  };
}

export interface PendingQuestion {
  id: string; question: string; asker: string; askedAt: string; product: string; slug: string;
}

export async function getPendingQuestions(): Promise<PendingQuestion[] | null> {
  if (!hasSupabase) return null;
  const { data, error } = await secretDb()
    .from("product_questions")
    .select("id, question, asker_name, created_at, products!inner(title, slug)")
    .eq("status", "pending")
    .order("created_at")
    .limit(100);
  if (error) throw new Error(`Questions: ${error.message}`);
  return (data ?? []).map((q) => {
    const p = q.products as unknown as { title: string; slug: string };
    return { id: q.id, question: q.question, asker: q.asker_name, askedAt: q.created_at, product: p.title, slug: p.slug };
  });
}
