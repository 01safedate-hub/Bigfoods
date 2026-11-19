import "server-only";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

/** Variant text "Colour:Black;Size:M" → "Black / M". */
export const variantText = (v: string | null | undefined) => (v ?? "").split(";").map((p) => p.replace(/^[^:]*:/, "").trim()).filter(Boolean).join(" / ");
const lagosDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export interface BuyRow { sku_id: string; title: string; variant: string; supplier: string | null; cny: number; est: number; orders: number; need: number; covered: number; short: number; sea: boolean }
export interface PurchaseView {
  id: string; ref: string; kind: "buy" | "restock"; bought_on: string; supplier: string | null; ship_mode: string; status: "expected" | "arrived"; arrived_on: string | null; note: string | null;
  fees: { category: string; amount_ngn: number; note: string | null }[];
  lines: { id: string; title: string; variant: string; qty: number; received: number | null; unit_ngn: number; landed_ngn: number; assigned: number; customers: number }[];
}
export interface QueueOrder {
  id: string; code: string; status: string; state: string; station: string | null; name: string | null; phone: string; paid_at: string | null; channel: string;
  units: number; assigned: number; arrived: number; ready: boolean;
  items: { title: string; variant: string; qty: number; assigned: number; arrived: number }[];
}
export interface DispatchView { id: string; ref: string; sent_on: string; carrier: string; state: string | null; extra: number; note: string | null; total: number; orders: { code: string; name: string | null; state: string; cost: number; tracking: string | null; status: string }[] }
export interface StockRow { sku_id: string; title: string; variant: string; expected: number; on_hand: number; on_hand_assigned: number; expected_assigned: number; sent: number; short: number; avg: number }
export interface ReturnView { id: string; code: string; name: string | null; phone: string; title: string; qty: number; reason: string; refund: number; fee: number; restocked: boolean; note: string | null; at: string }

export interface StockFilters { state?: string; from?: string; to?: string; show?: "ready" | "waiting" | "all" }

export interface StockBoard {
  buy: BuyRow[]; purchases: PurchaseView[]; queue: QueueOrder[]; states: string[]; dispatches: DispatchView[]; stock: StockRow[]; returns: ReturnView[];
}

type Line = { id: string; qty: number; received_qty: number | null; unit_ngn: number; product_skus: { props_text: string | null; products: { title: string } } | null; allocations: { qty: number; order_item_id: string; locked: boolean; order_items: { order_id: string } | null }[] };

/** Everything the Purchasing & dispatch screen shows. Call only after a staff check. */
export async function getStockBoard(f: StockFilters): Promise<StockBoard | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  let q = db.from("orders")
    .select("id, code, status, state, phone, paid_at, channel, customer_id, pickup_stations(name), order_items(id, title, variant_label, qty, removed_at, released_at, allocations(qty, purchase_lines(purchases(status))))")
    .in("status", ["paid", "purchasing", "purchased", "at_warehouse"])
    .order("paid_at", { ascending: true })
    .limit(500);
  if (f.state) q = q.eq("state", f.state);
  if (f.from) q = q.gte("paid_at", `${f.from}T00:00:00+01:00`);
  if (f.to) q = q.lte("paid_at", `${f.to}T23:59:59+01:00`);

  const [buy, pur, ord, st, ds, stock, ret] = await Promise.all([
    db.from("buy_list").select("*").order("short", { ascending: false }).limit(300),
    db.from("purchases")
      .select("id, ref, kind, bought_on, supplier, ship_mode, status, arrived_on, note, expenses(category, amount_ngn, note), purchase_lines(id, qty, received_qty, unit_ngn, product_skus(props_text, products(title)), allocations(qty, order_item_id, locked, order_items(order_id)))")
      .order("created_at", { ascending: false }).limit(60),
    q,
    db.from("orders").select("state").in("status", ["paid", "purchasing", "purchased", "at_warehouse"]).limit(5000),
    db.from("dispatches").select("id, ref, sent_on, carrier, state, extra_cost_ngn, note, dispatch_orders(ship_cost_ngn, tracking, orders(code, state, status, customer_id))").order("created_at", { ascending: false }).limit(40),
    db.from("stock_levels").select("*").order("title").limit(500),
    db.from("order_returns").select("id, qty, reason, refund_ngn, fee_ngn, restocked, note, created_at, orders(code, phone, customer_id), order_items(title, variant_label)").order("created_at", { ascending: false }).limit(50),
  ]);
  const err = buy.error ?? pur.error ?? ord.error ?? st.error ?? ds.error ?? stock.error ?? ret.error;
  if (err) throw new Error(`Stock: ${err.message}`);

  const landed = new Map<string, number>();
  const lineIds = (pur.data ?? []).flatMap((p) => (p.purchase_lines as unknown as Line[]).map((l) => l.id));
  if (lineIds.length) {
    const { data } = await db.from("landed_lines").select("line_id, landed_ngn").in("line_id", lineIds);
    for (const r of data ?? []) landed.set(r.line_id, r.landed_ngn);
  }

  const customerIds = new Set<string>();
  for (const o of ord.data ?? []) if (o.customer_id) customerIds.add(o.customer_id);
  for (const d of ds.data ?? []) for (const x of d.dispatch_orders as unknown as { orders: { customer_id: string | null } }[]) if (x.orders?.customer_id) customerIds.add(x.orders.customer_id);
  for (const r of ret.data ?? []) { const c = (r.orders as unknown as { customer_id: string | null })?.customer_id; if (c) customerIds.add(c); }
  const names = new Map<string, string | null>();
  if (customerIds.size) {
    const { data } = await db.from("profiles").select("id, full_name").in("id", [...customerIds]);
    for (const p of data ?? []) names.set(p.id, p.full_name);
  }

  type OI = { id: string; title: string; variant_label: string | null; qty: number; removed_at: string | null; released_at: string | null; allocations: { qty: number; purchase_lines: { purchases: { status: string } } | null }[] };
  let queue: QueueOrder[] = (ord.data ?? []).map((o) => {
    const items = (o.order_items as unknown as OI[]).filter((i) => !i.removed_at).map((i) => {
      const assigned = Math.min(i.qty, i.allocations.reduce((n, a) => n + a.qty, 0));
      const arrived = Math.min(i.qty, i.allocations.reduce((n, a) => n + (a.purchase_lines?.purchases?.status === "arrived" ? a.qty : 0), 0));
      return { title: i.title, variant: variantText(i.variant_label), qty: i.qty, assigned, arrived };
    });
    const units = items.reduce((n, i) => n + i.qty, 0);
    const arrived = items.reduce((n, i) => n + i.arrived, 0);
    return {
      id: o.id, code: o.code, status: o.status, state: o.state, station: (o.pickup_stations as unknown as { name: string } | null)?.name ?? null,
      name: o.customer_id ? names.get(o.customer_id) ?? null : null, phone: o.phone, paid_at: o.paid_at, channel: o.channel,
      units, assigned: items.reduce((n, i) => n + i.assigned, 0), arrived, ready: o.status === "at_warehouse" && units > 0 && arrived >= units, items,
    };
  });
  if (f.show === "ready" || !f.show) queue = queue.filter((o) => o.ready);
  else if (f.show === "waiting") queue = queue.filter((o) => !o.ready);

  return {
    buy: (buy.data ?? []).map((r) => ({ sku_id: r.sku_id, title: r.title, variant: variantText(r.variant), supplier: r.supplier, cny: Number(r.cny_price ?? 0), est: r.est_cost_ngn, orders: r.orders, need: r.need, covered: r.covered, short: r.short, sea: !!r.sea })),
    purchases: (pur.data ?? []).map((p) => {
      const lines = p.purchase_lines as unknown as Line[];
      return {
        id: p.id, ref: p.ref, kind: p.kind, bought_on: p.bought_on, supplier: p.supplier, ship_mode: p.ship_mode, status: p.status, arrived_on: p.arrived_on, note: p.note,
        fees: (p.expenses ?? []) as PurchaseView["fees"],
        lines: lines.map((l) => ({
          id: l.id, title: l.product_skus?.products.title ?? "Product", variant: variantText(l.product_skus?.props_text), qty: l.qty, received: l.received_qty, unit_ngn: l.unit_ngn,
          landed_ngn: landed.get(l.id) ?? l.unit_ngn, assigned: l.allocations.reduce((n, a) => n + a.qty, 0),
          customers: new Set(l.allocations.map((a) => a.order_items?.order_id)).size,
        })),
      };
    }),
    queue,
    states: [...new Set((st.data ?? []).map((r) => r.state as string))].sort(),
    dispatches: (ds.data ?? []).map((d) => {
      const orders = (d.dispatch_orders as unknown as { ship_cost_ngn: number; tracking: string | null; orders: { code: string; state: string; status: string; customer_id: string | null } }[]).map((x) => ({
        code: x.orders.code, state: x.orders.state, status: x.orders.status, cost: x.ship_cost_ngn, tracking: x.tracking, name: x.orders.customer_id ? names.get(x.orders.customer_id) ?? null : null,
      }));
      return { id: d.id, ref: d.ref, sent_on: d.sent_on, carrier: d.carrier, state: d.state, extra: d.extra_cost_ngn, note: d.note, orders, total: orders.reduce((n, o) => n + o.cost, 0) + d.extra_cost_ngn };
    }),
    stock: (stock.data ?? []).map((s) => ({ sku_id: s.sku_id, title: s.title, variant: variantText(s.variant), expected: s.expected, on_hand: s.on_hand, on_hand_assigned: s.on_hand_assigned, expected_assigned: s.expected_assigned, sent: s.sent, short: s.short, avg: s.avg_landed_ngn })),
    returns: (ret.data ?? []).map((r) => {
      const o = r.orders as unknown as { code: string; phone: string; customer_id: string | null };
      const i = r.order_items as unknown as { title: string; variant_label: string | null } | null;
      return {
        id: r.id, code: o.code, phone: o.phone, name: o.customer_id ? names.get(o.customer_id) ?? null : null, title: i ? `${i.title}${i.variant_label ? ` · ${variantText(i.variant_label)}` : ""}` : "Whole order",
        qty: r.qty, reason: r.reason, refund: r.refund_ngn, fee: r.fee_ngn, restocked: r.restocked, note: r.note, at: lagosDay(r.created_at),
      };
    }),
  };
}

export interface SkuOption { id: string; title: string; variant: string; cny: number; est: number }

export async function searchSkus(term: string): Promise<SkuOption[]> {
  if (!hasSupabase) return [];
  const t = term.trim().replace(/[%_,()]/g, " ");
  if (t.length < 2) return [];
  const { data, error } = await secretDb().from("product_skus")
    .select("id, props_text, cny_price, cost_ngn, products!inner(title, is_demo)")
    .ilike("products.title", `%${t}%`).eq("products.is_demo", false).limit(40);
  if (error) throw new Error(error.message);
  return (data ?? []).map((k) => ({ id: k.id, title: (k.products as unknown as { title: string }).title, variant: variantText(k.props_text), cny: Number(k.cny_price ?? 0), est: Math.round(Number(k.cost_ngn ?? 0)) }));
}

export interface ReturnLookup { id: string; code: string; status: string; paid: number; refunded: number; name: string | null; phone: string; items: { id: string; title: string; variant: string; qty: number; unit_ngn: number }[] }

export async function findOrderForReturn(code: string): Promise<ReturnLookup | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  const { data: o } = await db.from("orders").select("id, code, status, paid_ngn, phone, customer_id, order_items(id, title, variant_label, qty, unit_ngn, removed_at), order_returns(refund_ngn)").eq("code", code.toUpperCase()).maybeSingle();
  if (!o) return null;
  let name: string | null = null;
  if (o.customer_id) name = (await db.from("profiles").select("full_name").eq("id", o.customer_id).maybeSingle()).data?.full_name ?? null;
  return {
    id: o.id, code: o.code, status: o.status, paid: o.paid_ngn, phone: o.phone, name,
    refunded: (o.order_returns as { refund_ngn: number }[]).reduce((n, r) => n + r.refund_ngn, 0),
    items: (o.order_items as { id: string; title: string; variant_label: string | null; qty: number; unit_ngn: number; removed_at: string | null }[]).filter((i) => !i.removed_at).map((i) => ({ id: i.id, title: i.title, variant: variantText(i.variant_label), qty: i.qty, unit_ngn: i.unit_ngn })),
  };
}

// ---- Accounts ----------------------------------------------------------------------------------

export interface Report {
  from: string; to: string; orders: number; sales: number; wholesale_sales: number; refunds: number; goods_actual: number; goods_estimated: number; restocked: number;
  seller_share: number; shipping_out: number; returns_fees: number; other_expenses: number; expenses_by_category: Record<string, number>; purchase_fees_by_category: Record<string, number>;
  spend_goods: number; spend_fees: number; purchases: number; shipped_orders: number; returns: number; refunds_pending: number; stock_value: number; stock_units: number; expected_units: number;
}
export interface ExpenseRow { id: string; spent_on: string; category: string; amount_ngn: number; note: string | null; link: string | null; manual: boolean }

export async function getAccounts(from: string, to: string, category?: string): Promise<{ report: Report; expenses: ExpenseRow[] } | null> {
  if (!hasSupabase) return null;
  const db = secretDb();
  let q = db.from("expenses").select("id, spent_on, category, amount_ngn, note, purchases(ref), dispatches(ref), order_returns(orders(code))")
    .gte("spent_on", from).lte("spent_on", to).order("spent_on", { ascending: false }).order("created_at", { ascending: false }).limit(300);
  if (category) q = q.eq("category", category);
  const [r, e] = await Promise.all([db.rpc("accounts_report", { p_from: from, p_to: to }), q]);
  if (r.error ?? e.error) throw new Error(`Accounts: ${(r.error ?? e.error)!.message}`);
  return {
    report: r.data as Report,
    expenses: (e.data ?? []).map((x) => {
      const po = (x.purchases as unknown as { ref: string } | null)?.ref;
      const dsr = (x.dispatches as unknown as { ref: string } | null)?.ref;
      const rc = (x.order_returns as unknown as { orders: { code: string } } | null)?.orders?.code;
      return { id: x.id, spent_on: x.spent_on, category: x.category, amount_ngn: x.amount_ngn, note: x.note, link: po ?? dsr ?? (rc ? `#${rc}` : null), manual: !po && !dsr && !rc };
    }),
  };
}
