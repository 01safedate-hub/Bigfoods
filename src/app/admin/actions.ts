"use server";

import { updateTag } from "next/cache";
import { hasSupabase } from "@/lib/supabase/env";
import { requireStaff } from "@/lib/supabase/auth";
import { secretDb } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };

/** Records the total bought for a variant; the database fills the oldest paid orders first and advances them. */
export async function recordPurchase(skuId: unknown, bought: unknown): Promise<Result> {
  await requireStaff();
  if (typeof skuId !== "string" || !Number.isInteger(bought) || (bought as number) < 0 || (bought as number) > 100_000) return { ok: false, message: "Enter a whole number." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().rpc("record_purchase", { p_sku: skuId, p_bought: bought });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Saved" };
}

/** Ships every bought order for one state; auto-delivery runs 10 days later. */
export async function dispatchState(state: unknown): Promise<Result & { moved?: number }> {
  await requireStaff();
  if (typeof state !== "string" || state.length > 40) return { ok: false, message: "Unknown state." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().rpc("dispatch_state", { p_state: state });
  return error ? { ok: false, message: error.message } : { ok: true, message: `${data} orders dispatched`, moved: data as number };
}

/** Answers a product question. It shows on the product page straight away. */
export async function answerQuestion(id: unknown, answer: unknown, hide = false): Promise<Result> {
  const staff = await requireStaff();
  if (typeof id !== "string") return { ok: false, message: "Unknown question." };
  const text = typeof answer === "string" ? answer.trim() : "";
  if (!hide && (text.length < 2 || text.length > 1000)) return { ok: false, message: "Write an answer (up to 1,000 characters)." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const db = secretDb();
  const patch = hide ? { status: "hidden" } : { answer: text, status: "answered", answered_by: staff?.id ?? null, answered_at: new Date().toISOString() };
  const { data, error } = await db.from("product_questions").update(patch).eq("id", id).eq("status", "pending").select("products(slug)").maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Someone already handled this question." };
  const slug = (data.products as unknown as { slug: string } | null)?.slug;
  if (slug) updateTag(`qa:${slug}`);
  return { ok: true, message: hide ? "Hidden" : "Answered" };
}

const ROLES = ["customer", "super_admin", "finance", "purchasing", "warehouse", "customer_care", "marketing"] as const;

async function isSuperAdmin(userId: string) {
  const { data } = await secretDb().from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "super_admin";
}

/** Cancel before purchase, or refund a shipped order that never arrived. Money goes back once (the database refuses repeats). */
export async function cancelOrder(orderId: unknown, note: unknown): Promise<Result> {
  await requireStaff();
  if (typeof orderId !== "string") return { ok: false, message: "Unknown order." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { data, error } = await secretDb().rpc("cancel_or_refund", { p_order: orderId, p_note: typeof note === "string" ? note.slice(0, 200) : "" });
  return error ? { ok: false, message: error.message } : { ok: true, message: data === "refunded" ? "Refunded" : "Cancelled" };
}

/** Super admins only. The database also refuses demoting the last super admin. */
export async function setRole(userId: unknown, role: unknown): Promise<Result> {
  const me = await requireStaff();
  if (typeof userId !== "string" || !ROLES.includes(role as (typeof ROLES)[number])) return { ok: false, message: "Unknown role." };
  if (!hasSupabase || !me) return { ok: true, message: "Demo: not saved." };
  if (!(await isSuperAdmin(me.id))) return { ok: false, message: "Only a super admin can change roles." };
  const { error } = await secretDb().rpc("set_staff_role", { p_actor: me.id, p_user: userId, p_role: role });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Role updated" };
}

type Table = "coupons" | "sale_events" | "pickup_stations";
const EDITABLE: Record<Table, string[]> = {
  coupons: ["id", "label", "title", "rule", "amount_ngn", "percent", "max_off_ngn", "min_spend_ngn", "gadget_only", "active", "ends_at"],
  sale_events: ["id", "name", "starts_on", "ends_on", "theme", "kicker", "title", "sub", "color", "early_access_days", "active"],
  pickup_stations: ["id", "state", "area", "name", "hours", "active"],
};

/** Create or update a coupon, sale event or pickup station. Database checks still apply (e.g. percentage coupons need a cap). */
export async function saveRow(table: unknown, row: unknown): Promise<Result> {
  await requireStaff();
  if (typeof table !== "string" || !(table in EDITABLE) || typeof row !== "object" || !row) return { ok: false, message: "Nothing to save." };
  const allowed = EDITABLE[table as Table];
  const clean = Object.fromEntries(Object.entries(row).filter(([k, v]) => allowed.includes(k) && v !== undefined).map(([k, v]) => [k, v === "" ? null : v]));
  if (table === "sale_events" && !clean.id) delete clean.id;
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().from(table as Table).upsert(clean);
  if (error) return { ok: false, message: error.message };
  updateTag("site");
  return { ok: true, message: "Saved" };
}
