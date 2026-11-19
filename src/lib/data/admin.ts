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

export interface Dashboard {
  sales_today: number; orders_today: number; sales_7d: number; profit_7d: number;
  daily: { d: string; sales: number }[];
  by_status: Record<string, number>;
  plans_at_risk: number; questions_pending: number; refunds_pending: number;
  guard: { run_at: string; checked: number; safe: number; watch: number; paused: number; blocked: number } | null;
  guarded: { title: string; variant: string | null; verdict: "watch" | "pause" | "block" }[];
}

export async function getDashboard(): Promise<Dashboard | null> {
  if (!hasSupabase) return null;
  const { data, error } = await secretDb().rpc("admin_dashboard");
  if (error) throw new Error(`Dashboard: ${error.message}`);
  return data as Dashboard;
}

export interface AdminOrder {
  id: string; code: string; status: string; pay_mode: string; total_ngn: number; paid_ngn: number; state: string; phone: string | null;
  created_at: string; items: { title: string; variant_label: string | null; qty: number; unit_ngn: number }[];
}

/** Newest first; search by code or phone, filter by status and state. */
export async function listOrders(f: { q?: string; status?: string; state?: string }): Promise<AdminOrder[] | null> {
  if (!hasSupabase) return null;
  let query = secretDb()
    .from("orders")
    .select("id, code, status, pay_mode, total_ngn, paid_ngn, state, phone, created_at, order_items(title, variant_label, qty, unit_ngn)")
    .order("created_at", { ascending: false })
    .limit(100);
  const q = f.q?.trim().replace(/[^A-Za-z0-9+]/g, "");
  if (q) query = /^[A-Za-z0-9]{8}$/.test(q) ? query.eq("code", q.toUpperCase()) : query.ilike("phone", `%${q.replace(/^0/, "")}%`);
  if (f.status) query = query.eq("status", f.status);
  if (f.state) query = query.eq("state", f.state);
  const { data, error } = await query;
  if (error) throw new Error(`Orders: ${error.message}`);
  return (data ?? []).map((o) => ({ ...o, items: o.order_items })) as AdminOrder[];
}

export interface StaffMember {
  id: string; name: string | null; email: string | null; phone: string | null; role: string; created_at: string;
}

/** Everyone with a staff role, plus a search over customers to promote. */
export async function listStaff(search?: string): Promise<StaffMember[] | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  const byId = new Map((users?.users ?? []).map((u) => [u.id, u]));
  let q = db.from("profiles").select("id, full_name, phone, role, created_at").order("created_at");
  q = search?.trim() ? q.in("id", [...byId.values()].filter((u) => `${u.email} ${u.phone}`.toLowerCase().includes(search.trim().toLowerCase())).map((u) => u.id).slice(0, 50)) : q.neq("role", "customer");
  const { data, error } = await q;
  if (error) throw new Error(`Staff: ${error.message}`);
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name, email: byId.get(p.id)?.email ?? null, phone: p.phone ?? byId.get(p.id)?.phone ?? null, role: p.role, created_at: p.created_at }));
}

export interface EditorData {
  coupons: { id: string; label: string; title: string; rule: string; amount_ngn: number | null; percent: number | null; max_off_ngn: number | null; min_spend_ngn: number; gadget_only: boolean; active: boolean; ends_at: string | null }[];
  events: { id: string; name: string; starts_on: string; ends_on: string; theme: string; kicker: string; title: string; sub: string; color: string; early_access_days: number; active: boolean }[];
  stations: { id: string; state: string; area: string; name: string; hours: string | null; active: boolean }[];
}

export async function getEditorData(): Promise<EditorData | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  const [c, e, s] = await Promise.all([
    db.from("coupons").select("id, label, title, rule, amount_ngn, percent, max_off_ngn, min_spend_ngn, gadget_only, active, ends_at").order("sort"),
    db.from("sale_events").select("id, name, starts_on, ends_on, theme, kicker, title, sub, color, early_access_days, active").order("starts_on"),
    db.from("pickup_stations").select("id, state, area, name, hours, active").order("state").order("sort"),
  ]);
  const err = c.error ?? e.error ?? s.error;
  if (err) throw new Error(`Settings: ${err.message}`);
  return { coupons: c.data ?? [], events: e.data ?? [], stations: s.data ?? [] };
}

export interface OutboxRow { id: string; to_email: string; template: string; status: string; attempts: number; last_error: string | null; created_at: string; sent_at: string | null }

export async function getOutbox(status?: string): Promise<{ rows: OutboxRow[]; counts: Record<string, number> } | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  let q = db.from("email_outbox").select("id, to_email, template, status, attempts, last_error, created_at, sent_at").order("created_at", { ascending: false }).limit(50);
  if (status) q = q.eq("status", status);
  const [{ data, error }, ...counts] = await Promise.all([
    q,
    ...["pending", "sent", "failed"].map((s) => db.from("email_outbox").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);
  if (error) throw new Error(`Outbox: ${error.message}`);
  return { rows: (data ?? []) as OutboxRow[], counts: { pending: counts[0].count ?? 0, sent: counts[1].count ?? 0, failed: counts[2].count ?? 0 } };
}

export interface AdminStore {
  id: string; slug: string; name: string; plan: string; plan_renews_at: string | null; status: string; lifetime_sales_ngn: number;
  custom_domain: string | null; domain_verified: boolean; created_at: string; products: number; owner: string | null;
  payouts: { id: string; amount_ngn: number; items: number; status: string; created_at: string; bank_snapshot: { bank?: string; account?: string; name?: string } }[];
}

export async function listStores(q?: string): Promise<AdminStore[] | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  let query = db.from("stores").select("id, slug, name, plan, plan_renews_at, status, lifetime_sales_ngn, custom_domain, domain_verified, created_at, owner_id, store_products(count), seller_payouts(id, amount_ngn, items, status, created_at, bank_snapshot)")
    .order("created_at", { ascending: false }).limit(100);
  if (q?.trim()) query = query.or(`slug.ilike.%${q.trim().replace(/[^a-z0-9-]/gi, "")}%,name.ilike.%${q.trim().replace(/[%,()]/g, "")}%`);
  const { data, error } = await query;
  if (error) throw new Error(`Stores: ${error.message}`);
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  const email = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? u.phone ?? null]));
  return (data ?? []).map((s) => ({
    ...s, owner: email.get(s.owner_id) ?? null,
    products: (s.store_products as unknown as { count: number }[])[0]?.count ?? 0,
    payouts: ((s.seller_payouts ?? []) as AdminStore["payouts"]).filter((p) => p.status !== "paid"),
  })) as AdminStore[];
}

export interface AdminProduct {
  slug: string; title: string; status: string; source: string; price_list_min: number | null; main_images: string[]; created_at: string;
  category: string | null;
}

/** Catalogue for staff: newest first, any status, searchable by name. */
export async function listAdminProducts(f: { q?: string; status?: string; source?: string }): Promise<AdminProduct[] | null> {
  if (!hasSupabase) return null;
  let query = secretDb()
    .from("products")
    .select("slug, title, status, source, price_list_min, main_images, created_at, categories(name)")
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .limit(100);
  const q = f.q?.trim().replace(/[%_,()]/g, " ");
  if (q) query = query.ilike("title", `%${q}%`);
  if (f.status) query = query.eq("status", f.status);
  if (f.source) query = query.eq("source", f.source);
  const { data, error } = await query;
  if (error) throw new Error(`Products: ${error.message}`);
  return (data ?? []).map((p) => ({ ...p, category: (p.categories as unknown as { name: string } | null)?.name ?? null })) as AdminProduct[];
}
