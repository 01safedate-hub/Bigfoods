"use server";

import { updateTag } from "next/cache";
import { RESERVED, SLUG_RE } from "@/lib/dropship/plans";
import { allow, TOO_MANY } from "@/lib/rate-limit";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { publicDb } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };
const DEMO: Result = { ok: true, message: "Demo mode: connect the database to save." };

async function myStore() {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await userDb();
  const { data } = await db.from("stores").select("id, slug, plan").eq("owner_id", user.id).maybeSingle();
  return data ? { db, store: data } : null;
}

/** Turns database messages (plan limits, locked themes) into what the seller sees. */
const friendly = (m: string) => (/duplicate key.*slug/.test(m) ? "That address is taken. Try another." : /duplicate key.*custom_domain/.test(m) ? "That domain is already connected to another store." : m);

export async function checkSlug(slug: unknown): Promise<{ ok: boolean; message: string }> {
  const s = typeof slug === "string" ? slug.toLowerCase() : "";
  if (!SLUG_RE.test(s)) return { ok: false, message: "3–30 letters, numbers or dashes." };
  if (RESERVED.has(s)) return { ok: false, message: "That address is reserved." };
  if (!hasSupabase) return { ok: true, message: "Available" };
  const { data } = await publicDb().from("stores").select("id").eq("slug", s).maybeSingle();
  return data ? { ok: false, message: "That address is taken." } : { ok: true, message: "Available" };
}

export async function createStore(input: { name: unknown; slug: unknown; tagline?: unknown }): Promise<Result> {
  if (!hasSupabase) return DEMO;
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to open a store." };
  if (!(await allow("store-create", 5, 3600, user.id))) return { ok: false, message: TOO_MANY };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const slug = typeof input.slug === "string" ? input.slug.toLowerCase().trim() : "";
  if (name.length < 2 || name.length > 40) return { ok: false, message: "Store name: 2–40 characters." };
  const check = await checkSlug(slug);
  if (!check.ok) return check;
  const tagline = typeof input.tagline === "string" ? input.tagline.trim().slice(0, 90) : null;
  const { error } = await (await userDb()).from("stores").insert({ name, slug, tagline: tagline || null });
  return error ? { ok: false, message: friendly(error.message) } : { ok: true, message: "Your store is live." };
}

export async function updateStore(patch: Record<string, unknown>): Promise<Result> {
  if (!hasSupabase) return DEMO;
  const m = await myStore();
  if (!m) return { ok: false, message: "Open a store first." };
  const allowed = ["name", "tagline", "accent", "theme", "custom_domain"];
  const clean: Record<string, string | boolean | null> = Object.fromEntries(Object.entries(patch).filter(([k, v]) => allowed.includes(k) && (typeof v === "string" || v === null)).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : null]));
  if (typeof patch.allow_small_small === "boolean") clean.allow_small_small = patch.allow_small_small;
  if (typeof clean.custom_domain === "string") clean.custom_domain = clean.custom_domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const { error } = await m.db.from("stores").update(clean).eq("id", m.store.id);
  if (error) return { ok: false, message: friendly(error.message) };
  updateTag(`store:${m.store.slug}`);
  return { ok: true, message: "Saved" };
}

export async function saveBank(input: { bank_name: unknown; account_number: unknown; account_name: unknown }): Promise<Result> {
  if (!hasSupabase) return DEMO;
  const m = await myStore();
  if (!m) return { ok: false, message: "Open a store first." };
  const acct = typeof input.account_number === "string" ? input.account_number.replace(/\D/g, "") : "";
  if (acct.length !== 10) return { ok: false, message: "Account numbers are 10 digits (NUBAN)." };
  const bank = typeof input.bank_name === "string" ? input.bank_name.trim().slice(0, 60) : "";
  const name = typeof input.account_name === "string" ? input.account_name.trim().slice(0, 80) : "";
  if (!bank || !name) return { ok: false, message: "Add your bank and the name on the account." };
  const { error } = await m.db.from("stores").update({ bank_name: bank, account_number: acct, account_name: name }).eq("id", m.store.id);
  return error ? { ok: false, message: friendly(error.message) } : { ok: true, message: "Payout account saved" };
}

export interface MyListing { slug: string; markupType: "pct" | "fixed"; markupValue: number; active: boolean }

export async function myListings(): Promise<MyListing[] | null> {
  if (!hasSupabase) return null;
  const m = await myStore();
  if (!m) return [];
  const { data } = await m.db.from("store_products").select("markup_type, markup_value, active, products!inner(slug)").eq("store_id", m.store.id).order("sort").order("created_at");
  return (data ?? []).map((r) => ({ slug: (r.products as unknown as { slug: string }).slug, markupType: r.markup_type, markupValue: Number(r.markup_value), active: r.active }));
}

/** Adds or updates a product in the store. The database enforces the plan's product limit. */
export async function saveListing(slug: unknown, markupType: unknown, markupValue: unknown, active = true): Promise<Result> {
  if (!hasSupabase) return DEMO;
  const m = await myStore();
  if (!m) return { ok: false, message: "Open a store first." };
  if (typeof slug !== "string" || (markupType !== "pct" && markupType !== "fixed")) return { ok: false, message: "Choose a product and a markup." };
  const value = Number(markupValue);
  if (!Number.isFinite(value) || value < 0 || (markupType === "pct" && value > 300) || (markupType === "fixed" && value > 5_000_000)) return { ok: false, message: "Markup: 0–300% or up to ₦5,000,000." };
  const { data: p } = await m.db.from("products").select("id").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!p) return { ok: false, message: "That product isn’t available." };
  const { error } = await m.db.from("store_products").upsert({ store_id: m.store.id, product_id: p.id, markup_type: markupType, markup_value: value, active: Boolean(active) });
  if (error) return { ok: false, message: friendly(error.message) };
  updateTag(`store:${m.store.slug}`);
  return { ok: true, message: "Saved" };
}

export async function removeListing(slug: unknown): Promise<Result> {
  if (!hasSupabase) return DEMO;
  const m = await myStore();
  if (!m || typeof slug !== "string") return { ok: false, message: "Nothing to remove." };
  const { data: p } = await m.db.from("products").select("id").eq("slug", slug).maybeSingle();
  if (!p) return { ok: false, message: "Nothing to remove." };
  const { error } = await m.db.from("store_products").delete().eq("store_id", m.store.id).eq("product_id", p.id);
  if (error) return { ok: false, message: error.message };
  updateTag(`store:${m.store.slug}`);
  return { ok: true, message: "Removed" };
}

/** Upgrades are paid by card/transfer; this opens with Flutterwave. Until then, staff can activate a plan. */
export async function requestUpgrade(plan: unknown): Promise<Result> {
  if (plan !== "pro" && plan !== "elite") return { ok: false, message: "Choose Pro or Elite." };
  return { ok: false, message: "Online upgrades open with payments very soon. To upgrade today, message help@fastchina.shop and we’ll switch you over." };
}
