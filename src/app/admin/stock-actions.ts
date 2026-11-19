"use server";

import { revalidatePath } from "next/cache";
import { findOrderForReturn, type ReturnLookup, searchSkus, type SkuOption } from "@/lib/data/stock";
import { requireStaff } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";
import { EXPENSE_CATS, FEE_CATS } from "./money";

type Result = { ok: boolean; message: string };
type Role = "super_admin" | "finance" | "purchasing" | "warehouse" | "customer_care" | "marketing";

/** Staff with one of these roles (or demo mode). Returns the user id for the record, or a refusal. */
async function allow(roles: Role[]): Promise<{ id: string | null } | { refuse: string }> {
  const me = await requireStaff();
  if (!hasSupabase || !me) return { id: null };
  const { data } = await secretDb().from("profiles").select("role").eq("id", me.id).maybeSingle();
  const role = data?.role as Role | undefined;
  if (role === "super_admin" || (role && roles.includes(role))) return { id: me.id };
  return { refuse: `Your role (${role?.replace("_", " ") ?? "none"}) can’t do this. Ask a super admin.` };
}

const int = (v: unknown, max = 100_000_000) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max ? v : null);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const done = () => { revalidatePath("/admin/purchasing"); revalidatePath("/admin/accounts"); };

export async function findSkus(term: unknown): Promise<SkuOption[]> {
  await requireStaff();
  return typeof term === "string" ? searchSkus(term.slice(0, 60)) : [];
}

/** Goods bought: they become "expected" and are assigned to the customers who paid first. */
export async function recordPurchase(input: unknown): Promise<Result> {
  const who = await allow(["purchasing", "finance"]);
  if ("refuse" in who) return { ok: false, message: who.refuse };
  const i = (input ?? {}) as Record<string, unknown>;
  const lines = Array.isArray(i.lines) ? i.lines : [];
  const clean = lines.map((l) => ({ sku_id: uuid((l as Record<string, unknown>).sku_id), qty: int((l as Record<string, unknown>).qty, 100_000), unit_ngn: int((l as Record<string, unknown>).unit_ngn, 50_000_000) }));
  if (!clean.length) return { ok: false, message: "Add at least one product." };
  if (clean.some((l) => !l.sku_id || !l.qty || l.unit_ngn === null)) return { ok: false, message: "Every product needs a quantity (1 or more) and a price per unit." };
  const fees = (Array.isArray(i.fees) ? i.fees : []).map((f) => ({ category: String((f as Record<string, unknown>).category), amount_ngn: int((f as Record<string, unknown>).amount_ngn), note: text((f as Record<string, unknown>).note, 120) }))
    .filter((f) => f.amount_ngn);
  if (fees.some((f) => !(FEE_CATS as readonly string[]).includes(f.category))) return { ok: false, message: "Unknown fee type." };
  const ship = ["air", "sea", "local"].includes(i.ship as string) ? (i.ship as string) : "air";
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().rpc("stock_record_purchase", {
    p_actor: who.id, p_supplier: text(i.supplier, 120), p_ship_mode: ship, p_bought_on: date(i.date), p_note: text(i.note, 500), p_lines: clean, p_fees: fees,
  });
  if (error) return { ok: false, message: error.message };
  done();
  const d = data as { ref: string; units: number; assigned: number; customers: number };
  const spare = d.units - d.assigned;
  return { ok: true, message: `${d.ref} saved · ${d.assigned} of ${d.units} units assigned to ${d.customers} ${d.customers === 1 ? "order" : "orders"}${spare ? ` · ${spare} spare in stock` : ""}.` };
}

/** Goods are here. Enter what really came if it differs; the rest is taken as bought. */
export async function markArrived(purchaseId: unknown, received: unknown, on: unknown): Promise<Result> {
  const who = await allow(["warehouse", "purchasing"]);
  if ("refuse" in who) return { ok: false, message: who.refuse };
  const id = uuid(purchaseId);
  if (!id) return { ok: false, message: "Unknown purchase." };
  const got: Record<string, number> = {};
  for (const [k, v] of Object.entries((received ?? {}) as Record<string, unknown>)) { const n = int(v, 100_000); if (uuid(k) && n !== null) got[k] = n; }
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().rpc("stock_mark_arrived", { p_purchase: id, p_received: got, p_on: date(on) });
  if (error) return { ok: false, message: error.message };
  done();
  const d = data as { ref: string; ready: number };
  return { ok: true, message: `${d.ref} is in. ${d.ready} ${d.ready === 1 ? "order is" : "orders are"} complete and ready to send.` };
}

/** Sends complete orders out (Jumia by default) with the cost of each and any extra cost. */
export async function dispatchOrders(input: unknown): Promise<Result> {
  const who = await allow(["warehouse"]);
  if ("refuse" in who) return { ok: false, message: who.refuse };
  const i = (input ?? {}) as Record<string, unknown>;
  const orders = (Array.isArray(i.orders) ? i.orders : []).map((o) => ({ order_id: uuid((o as Record<string, unknown>).id), cost_ngn: int((o as Record<string, unknown>).cost, 10_000_000) ?? 0, tracking: text((o as Record<string, unknown>).tracking, 80) }));
  if (!orders.length || orders.some((o) => !o.order_id)) return { ok: false, message: "Tick the orders you’re sending." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().rpc("stock_dispatch", {
    p_actor: who.id, p_carrier: text(i.carrier, 60) || "Jumia", p_sent_on: date(i.date), p_extra_cost: int(i.extra, 10_000_000) ?? 0, p_note: text(i.note, 500), p_orders: orders,
  });
  if (error) return { ok: false, message: error.message };
  done();
  const d = data as { ref: string; orders: number; cost: number };
  return { ok: true, message: `${d.ref}: ${d.orders} ${d.orders === 1 ? "order" : "orders"} sent · ${naira(d.cost)} shipping booked as an expense.` };
}

export async function lookupOrder(code: unknown): Promise<ReturnLookup | { error: string }> {
  await requireStaff();
  const c = typeof code === "string" ? code.trim().replace(/^#/, "").toUpperCase() : "";
  if (!/^[A-Z0-9]{8}$/.test(c)) return { error: "Order codes have 8 letters and numbers." };
  return (await findOrderForReturn(c)) ?? { error: `No order #${c}.` };
}

/** Not collected / sent back: refund, any return fee, and whether the goods go back on the shelf. */
export async function recordReturn(input: unknown): Promise<Result> {
  const who = await allow(["warehouse", "customer_care", "finance"]);
  if ("refuse" in who) return { ok: false, message: who.refuse };
  const i = (input ?? {}) as Record<string, unknown>;
  const order = uuid(i.order);
  if (!order) return { ok: false, message: "Find the order first." };
  const reason = ["not_collected", "damaged", "wrong_item", "other"].includes(i.reason as string) ? (i.reason as string) : "not_collected";
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().rpc("stock_record_return", {
    p_actor: who.id, p_order: order, p_item: uuid(i.item), p_qty: int(i.qty, 100_000), p_reason: reason,
    p_refund: int(i.refund, 50_000_000) ?? 0, p_fee: int(i.fee, 10_000_000) ?? 0, p_restock: i.restock === true, p_note: text(i.note, 500),
  });
  if (error) return { ok: false, message: error.message };
  done();
  const d = data as { code: string; units: number; refund: number };
  return { ok: true, message: `Recorded for #${d.code}: ${d.units} ${d.units === 1 ? "unit" : "units"}${d.refund ? `, ${naira(d.refund)} refunded` : ""}${i.restock === true ? ", back in stock and re-assigned" : ""}.` };
}

/** Any other money out: rent, staff, adverts, packaging, bank charges… */
export async function addExpense(input: unknown): Promise<Result> {
  const who = await allow(["finance"]);
  if ("refuse" in who) return { ok: false, message: who.refuse };
  const i = (input ?? {}) as Record<string, unknown>;
  const amount = int(i.amount, 500_000_000);
  if (!amount) return { ok: false, message: "Enter the amount." };
  if (!EXPENSE_CATS.includes(i.category as string)) return { ok: false, message: "Pick a category." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().from("expenses").insert({ category: i.category, amount_ngn: amount, note: text(i.note, 300) || null, spent_on: date(i.date) ?? undefined, created_by: who.id });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true, message: `${naira(amount)} added.` };
}

/** Only hand-entered expenses can be removed; ones from purchases, dispatches and returns stay with them. */
export async function removeExpense(id: unknown): Promise<Result> {
  const who = await allow(["finance"]);
  if ("refuse" in who) return { ok: false, message: who.refuse };
  const eid = uuid(id);
  if (!eid) return { ok: false, message: "Unknown expense." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().from("expenses").delete().eq("id", eid).is("purchase_id", null).is("dispatch_id", null).is("return_id", null).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "This one belongs to a purchase, dispatch or return and can’t be removed here." };
  done();
  return { ok: true, message: "Removed." };
}
