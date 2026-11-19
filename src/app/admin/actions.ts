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

type Table = "coupons" | "sale_events" | "pickup_stations" | "categories" | "wholesale_kits";
const EDITABLE: Record<Table, string[]> = {
  categories: ["id", "wholesale_enabled", "wholesale_margin", "wholesale_sort"],
  wholesale_kits: ["id", "slug", "title", "subtitle", "tone", "categories", "max_products", "units_each", "sort", "active"],
  coupons: ["id", "label", "title", "rule", "amount_ngn", "percent", "max_off_ngn", "min_spend_ngn", "gadget_only", "active", "ends_at"],
  sale_events: ["id", "name", "starts_on", "ends_on", "theme", "kicker", "title", "sub", "color", "early_access_days", "active"],
  pickup_stations: ["id", "state", "area", "name", "address", "hours", "lat", "lng", "verified", "active"],
};

/** Create or update a coupon, sale event or pickup station. Database checks still apply (e.g. percentage coupons need a cap). */
export async function saveRow(table: unknown, row: unknown): Promise<Result> {
  await requireStaff();
  if (typeof table !== "string" || !(table in EDITABLE) || typeof row !== "object" || !row) return { ok: false, message: "Nothing to save." };
  const allowed = EDITABLE[table as Table];
  const clean = Object.fromEntries(Object.entries(row).filter(([k, v]) => allowed.includes(k) && v !== undefined).map(([k, v]) => [k, v === "" ? null : v]));
  if ((table === "sale_events" || table === "wholesale_kits") && !clean.id) delete clean.id;
  if (table === "categories" && !clean.id) return { ok: false, message: "Categories are added by the catalogue import." };
  if (table === "wholesale_kits" && typeof clean.categories === "string") {
    clean.categories = clean.categories.split(",").map((c) => c.trim()).filter(Boolean);
  }
  if (table === "wholesale_kits") clean.updated_at = new Date().toISOString();
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().from(table as Table).upsert(clean);
  if (error) return { ok: false, message: error.message };
  updateTag(table === "wholesale_kits" ? "kits" : table === "categories" ? "catalog" : "site");
  return { ok: true, message: table === "categories" ? "Saved. Prices are updating." : "Saved" };
}

const COST_FIELDS = ["clearing_per_kg", "sea_clearing_per_kg", "weighing_fee_per_item", "air_per_kg", "sea_per_cbm", "sea_kg_per_cbm", "sea_buffer", "wholesale_min_qty", "local_delivery_tiers"] as const;

/** Cost inputs that every price is built from. Super admin or Finance only; saving reprices every product. */
export async function saveCosts(input: unknown): Promise<Result> {
  const me = await requireStaff();
  if (!hasSupabase || !me) return { ok: true, message: "Demo: not saved." };
  const { data: prof } = await secretDb().from("profiles").select("role").eq("id", me.id).maybeSingle();
  if (!["super_admin", "finance"].includes(prof?.role ?? "")) return { ok: false, message: "Only Super admin or Finance can change costs." };
  if (!input || typeof input !== "object") return { ok: false, message: "Nothing to save." };
  const r = input as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of COST_FIELDS) {
    if (r[k] === undefined) continue;
    if (k === "local_delivery_tiers") {
      const tiers = r[k];
      if (!Array.isArray(tiers) || !tiers.length || tiers.some((t) => !t || typeof t.fee !== "number" || t.fee < 0 || (t.max_kg !== null && typeof t.max_kg !== "number"))) return { ok: false, message: "Check the delivery tiers." };
      patch[k] = tiers;
      continue;
    }
    const n = Number(r[k]);
    if (!Number.isFinite(n) || n < 0) return { ok: false, message: `Check ${k.replaceAll("_", " ")}.` };
    patch[k] = n;
  }
  patch.updated_at = new Date().toISOString();
  patch.updated_by = me.id;
  const { error } = await secretDb().from("pricing_settings").update(patch).eq("id", 1);
  if (error) return { ok: false, message: error.message };
  updateTag("catalog");
  return { ok: true, message: "Saved. Every price was recalculated." };
}

/** Puts a failed email back in the queue (the sender picks it up within a minute). */
export async function retryEmail(id: unknown): Promise<Result> {
  await requireStaff();
  if (typeof id !== "string") return { ok: false, message: "Unknown email." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().from("email_outbox").update({ status: "pending", attempts: 0, last_error: null, send_after: new Date().toISOString() }).eq("id", id).in("status", ["failed", "skipped"]);
  return error ? { ok: false, message: error.message } : { ok: true, message: "Queued again" };
}

/** Activates a paid plan (until online upgrades open) or moves a store back to Free. */
export async function setStorePlan(storeId: unknown, plan: unknown, months: unknown): Promise<Result> {
  await requireStaff();
  if (typeof storeId !== "string" || !["free", "pro", "elite"].includes(plan as string)) return { ok: false, message: "Choose a plan." };
  const m = Math.max(1, Math.min(12, Number(months) || 1));
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().rpc("set_store_plan", { p_store: storeId, p_plan: plan, p_months: m });
  if (error) return { ok: false, message: error.message };
  updateTag("stores");
  return { ok: true, message: plan === "free" ? "Moved to Free" : `${String(plan).replace(/^./, (c) => c.toUpperCase())} for ${m} month${m > 1 ? "s" : ""}` };
}

/** Marks a seller's own domain as checked (DNS pointing to us and HTTPS issued by hosting). */
export async function setDomainVerified(storeId: unknown, verified: unknown): Promise<Result> {
  await requireStaff();
  if (typeof storeId !== "string") return { ok: false, message: "Unknown store." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().from("stores").update({ domain_verified: verified === true }).eq("id", storeId);
  if (error) return { ok: false, message: error.message };
  updateTag("stores");
  return { ok: true, message: verified ? "Domain live" : "Domain switched off" };
}

export async function setStoreStatus(storeId: unknown, status: unknown): Promise<Result> {
  await requireStaff();
  if (typeof storeId !== "string" || (status !== "suspended" && status !== "active")) return { ok: false, message: "Unknown action." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const db = secretDb();
  const { data: s } = await db.from("stores").select("plan, lifetime_sales_ngn").eq("id", storeId).maybeSingle();
  // Reopening a free store that's over the limit puts it back to "needs upgrade", not fully open.
  const next = status === "active" && s?.plan === "free" && (s?.lifetime_sales_ngn ?? 0) >= 2_000_000 ? "needs_upgrade" : status;
  const { error } = await db.from("stores").update({ status: next }).eq("id", storeId);
  if (error) return { ok: false, message: error.message };
  updateTag("stores");
  return { ok: true, message: status === "suspended" ? "Store suspended" : "Store reopened" };
}

/** Records a payout as sent (with the bank transfer reference). */
export async function markPayoutPaid(payoutId: unknown, reference: unknown): Promise<Result> {
  await requireStaff();
  const ref = typeof reference === "string" ? reference.trim().slice(0, 80) : "";
  if (typeof payoutId !== "string" || !ref) return { ok: false, message: "Add the transfer reference." };
  if (!hasSupabase) return { ok: true, message: "Demo: not saved." };
  const { error } = await secretDb().from("seller_payouts").update({ status: "paid", reference: ref, paid_at: new Date().toISOString() }).eq("id", payoutId).eq("status", "pending");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Marked as paid" };
}
