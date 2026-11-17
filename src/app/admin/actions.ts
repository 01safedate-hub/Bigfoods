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
