"use server";

import type { Coupon } from "@/lib/pricing/engine";
import { getSiteData } from "@/lib/data/site";
import type { OrderStatus } from "@/lib/orders/lifecycle";
import { planOptions } from "@/lib/payments/instalments";
import { redirect } from "next/navigation";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { publicDb, secretDb } from "@/lib/supabase/server";
import type { PriceSet } from "@/lib/catalog/types";
import { getQuoteLines, insertQuestion, type LineRequest, searchSlugs } from "@/lib/data/catalog";
import { quoteCart } from "@/lib/pricing/engine";
import { unitFromPrices } from "@/lib/pricing/prices";
import { midnightDrop } from "@/lib/time";

/** Demo balance until accounts are connected. */
const DEMO_POINTS = 1240;
const MAX_LINES = 100;

function clean(items: unknown): LineRequest[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LINES).flatMap((i) => {
    const slug = typeof i?.slug === "string" ? i.slug.slice(0, 200) : "";
    const variantId = typeof i?.variantId === "string" ? i.variantId.slice(0, 200) : "";
    const qty = Number.isInteger(i?.qty) ? Math.min(999, Math.max(1, i.qty)) : 0;
    return slug && variantId && qty ? [{ slug, variantId, qty }] : [];
  });
}

const activePromo = () => (midnightDrop(Date.now()).live ? ("midnight" as const) : ("none" as const));

export interface PricedLine extends LineRequest {
  unit: number;
  prices: PriceSet;
}

/** Current selling prices for cart lines (handles price drops, Midnight Drop and 10+ retailer prices). */
export async function priceLines(items: LineRequest[]): Promise<PricedLine[]> {
  const promo = activePromo();
  const lines = await getQuoteLines(clean(items));
  return lines.map((l) => ({ slug: l.slug, variantId: l.variantId, qty: l.qty, prices: l.prices, unit: unitFromPrices(l.prices, l.qty, promo) }));
}

export interface CheckoutQuote {
  promo: "none" | "midnight";
  lines: PricedLine[];
  missing: number;
  subtotalList: number;
  subtotal: number;
  priceSavings: number;
  couponLabel: string | null;
  coupon: number;
  couponNote?: string;
  points: number;
  total: number;
}

/**
 * The checkout total. Runs on the server with costs the browser never sees, applies the best valid
 * coupon and enforces every guardrail. Returns selling amounts only (no costs or profit).
 */
/** Prices a cart on the server with costs the browser never sees and picks the best valid coupon. */
async function computeQuote(items: LineRequest[], claimedIds: unknown, pointsNaira: number) {
  const promo = activePromo();
  const requested = clean(items);
  const lines = await getQuoteLines(requested);
  const claimed = Array.isArray(claimedIds) ? claimedIds.filter((x): x is string => typeof x === "string") : [];
  // Coupon rules come from the database (only live coupons are readable), never from the browser.
  const { coupons } = await getSiteData();
  const pool = coupons.filter((c) => claimed.length === 0 || claimed.includes(c.id));

  let best: Coupon | null = null;
  let bestValue = 0;
  for (const c of pool) {
    const v = quoteCart(lines, { promo, coupon: c }).coupon;
    if (v > bestValue) [best, bestValue] = [c, v];
  }
  const q = quoteCart(lines, { promo, coupon: best, pointsNaira });
  return { promo, requested, lines, best, q };
}

export async function quoteCheckout(items: LineRequest[], opts: { claimedCouponIds?: string[]; usePoints?: boolean } = {}): Promise<CheckoutQuote> {
  const { promo, requested, lines, best, q } = await computeQuote(items, opts.claimedCouponIds, opts.usePoints ? DEMO_POINTS : 0);
  return {
    promo,
    lines: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, qty: l.qty, prices: l.prices, unit: unitFromPrices(l.prices, l.qty, promo) })),
    missing: requested.length - lines.length,
    subtotalList: q.subtotalList,
    subtotal: q.subtotal,
    priceSavings: q.priceSavings,
    couponLabel: best?.label ?? null,
    coupon: q.coupon,
    couponNote: q.couponNote,
    points: q.points,
    total: q.total,
  };
}

/** Ranked search results from the database; null means "search in the browser". */
export async function searchCatalog(q: unknown): Promise<string[] | null> {
  if (typeof q !== "string") return [];
  const term = q.trim().slice(0, 120);
  if (term.length < 2) return [];
  return searchSlugs(term);
}

/** A shopper's question about a product. Saved as pending until staff answer it. */
export async function askQuestion(slug: unknown, question: unknown, name?: unknown): Promise<{ ok: boolean; message: string }> {
  if (typeof slug !== "string" || typeof question !== "string") return { ok: false, message: "Something went wrong. Try again." };
  const q = question.replace(/\s+/g, " ").trim();
  if (q.length < 5) return { ok: false, message: "Write a little more so our team can help." };
  if (q.length > 300) return { ok: false, message: "Keep it under 300 characters." };
  if (/https?:\/\/|www\./i.test(q)) return { ok: false, message: "Links aren’t allowed in questions." };
  const who = typeof name === "string" && name.trim() ? name.trim().slice(0, 40) : "Customer";
  const res = await insertQuestion(slug.slice(0, 120), q, who);
  if (res === "unknown-product") return { ok: false, message: "This product isn’t available any more." };
  if (res === "busy") return { ok: false, message: "Lots of questions right now. Try again in a few minutes." };
  return { ok: true, message: "Sent. Our team usually answers within a few hours." };
}

export type PlaceResult = { ok: true; code: string; linkCode: string | null } | { ok: false; message: string; demo?: boolean };

/** Nigerian phone numbers to +234…; null if it isn't a plausible number. */
function normalisePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const d = raw.replace(/\D/g, "");
  const e164 = d.startsWith("234") ? d : d.startsWith("0") ? `234${d.slice(1)}` : d;
  return /^234[789][01]\d{8}$/.test(e164) ? `+${e164}` : null;
}

/**
 * Places an order. Everything is re-priced here; the browser only says what's in the cart.
 * Points aren't used yet (wallet balances arrive with payments). Payment is taken next (Flutterwave).
 */
export async function placeOrder(input: {
  items: LineRequest[]; stationId: string; phone: string; mode: "full" | "small" | "group"; weeks?: number; claimedCouponIds?: string[];
}): Promise<PlaceResult> {
  const phone = normalisePhone(input?.phone);
  if (!phone) return { ok: false, message: "Enter a Nigerian phone number for SMS updates." };
  if (!["full", "small", "group"].includes(input.mode)) return { ok: false, message: "Choose how to pay." };
  if (typeof input.stationId !== "string" || !input.stationId) return { ok: false, message: "Choose a pickup station." };
  if (!hasSupabase) return { ok: false, demo: true, message: "Demo mode: orders turn on when the database is connected." };

  const { requested, lines, best, q, promo } = await computeQuote(input.items, input.claimedCouponIds, 0);
  if (!lines.length) return { ok: false, message: "Your cart is empty." };
  if (lines.length !== requested.length) return { ok: false, message: "Some items changed or sold out. Check your cart and try again." };
  let weeks: number | null = null;
  if (input.mode === "small") {
    weeks = Number(input.weeks);
    if (!planOptions(q.total).includes(weeks)) return { ok: false, message: "That plan length isn’t available for this total." };
  }

  const user = await getSessionUser();
  const { data, error } = await secretDb().rpc("place_order", {
    p_customer: user?.id ?? null,
    p_station: input.stationId,
    p_phone: phone,
    p_mode: input.mode,
    p_total: q.total,
    p_discount: q.coupon + q.points,
    p_coupon: q.coupon > 0 ? best?.id ?? null : null,
    p_weeks: weeks,
    p_items: lines.map((l) => ({
      sku_id: l.variantId, qty: l.qty, unit: l.noDiscounts ? l.prices.list : unitFromPrices(l.prices, l.qty, promo),
      cost: Math.round(l.cost), title: l.title ?? l.slug, variant: l.variantLabel ?? "", ship: l.shipMode ?? "air",
    })),
  });
  if (error) return { ok: false, message: error.message };
  const row = (data as { code: string; link_code: string | null }[])[0];
  return { ok: true, code: row.code, linkCode: row.link_code };
}

export interface TrackedOrder {
  code: string; status: OrderStatus; pay_mode: string; total: number; paid: number; created_at: string; paid_at: string | null;
  shipped_at: string | null; delivered_at: string | null; station: string; state: string;
  items: { title: string; variant: string | null; qty: number; unit: number; ship: "air" | "sea"; funded: boolean; removed: boolean }[];
  events: { to: string; at: string }[];
  plan: { status: string; instalments: { n: number; due: string; amount: number }[] } | null;
  link: { code: string; expires_at: string } | null;
}

/** Guest tracking: order code + last 4 digits of the checkout phone number. */
export async function trackOrder(code: unknown, last4: unknown): Promise<{ ok: true; order: TrackedOrder } | { ok: false; message: string }> {
  if (typeof code !== "string" || !/^[A-Za-z0-9]{8}$/.test(code.trim())) return { ok: false, message: "Order codes are 8 letters and numbers." };
  if (typeof last4 !== "string" || !/^\d{4}$/.test(last4)) return { ok: false, message: "Enter the last 4 digits of your phone number." };
  if (!hasSupabase) return { ok: false, message: "Tracking turns on when the database is connected." };
  const { data, error } = await publicDb().rpc("track_order", { p_code: code.trim(), p_last4: last4 });
  if (error) return { ok: false, message: "Something went wrong. Try again." };
  return data ? { ok: true, order: data as TrackedOrder } : { ok: false, message: "We couldn’t find that order. Check the code and phone number." };
}

export async function signOut() {
  if (hasSupabase) await (await userDb()).auth.signOut();
  redirect("/");
}

/** Daily check-in: +5 points, +30 on the 7th day in a row. Once per Lagos day (enforced by the database). */
export async function checkIn(): Promise<{ ok: boolean; message: string; streak?: number }> {
  if (!hasSupabase) return { ok: false, message: "Check-in turns on when the database is connected." };
  const db = await userDb();
  const { data, error } = await db.rpc("daily_checkin");
  if (error) return { ok: false, message: error.message.includes("Sign in") ? "Sign in to check in." : "Try again in a moment." };
  const r = data as { already: boolean; points: number; streak: number };
  return { ok: true, streak: r.streak, message: r.already ? `Already checked in today · ${r.streak}-day streak` : `+${r.points} points · ${r.streak}-day streak` };
}

/** The signed-in customer's saved product slugs, or null when signed out (the browser keeps them instead). */
export async function myWishlist(): Promise<string[] | null> {
  if (!hasSupabase) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await (await userDb()).from("wishlists").select("products(slug)").order("created_at", { ascending: false });
  return (data ?? []).map((r) => (r.products as unknown as { slug: string }).slug);
}

/** Saves or removes products for the signed-in customer. Returns false when signed out. */
export async function syncWishlist(add: unknown, remove: unknown): Promise<boolean> {
  if (!hasSupabase) return false;
  const user = await getSessionUser();
  if (!user) return false;
  const slugs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 200) : []);
  const [a, r] = [slugs(add), slugs(remove)];
  const db = await userDb();
  const all = [...a, ...r];
  if (!all.length) return true;
  const { data: ps } = await db.from("products").select("id, slug").in("slug", all);
  const id = new Map((ps ?? []).map((p) => [p.slug, p.id]));
  const addIds = a.flatMap((s) => id.get(s) ?? []);
  const removeIds = r.flatMap((s) => id.get(s) ?? []);
  if (addIds.length) await db.from("wishlists").upsert(addIds.map((product_id) => ({ customer_id: user.id, product_id })), { ignoreDuplicates: true });
  if (removeIds.length) await db.from("wishlists").delete().eq("customer_id", user.id).in("product_id", removeIds);
  return true;
}

export interface LinkProgress { target: number; raised: number; expires_at: string; people: number; items: { title: string; amount: number; funded: boolean }[] }

/** Public progress for a Group pay link (totals and item names only). */
export async function linkProgress(code: unknown): Promise<LinkProgress | null> {
  if (!hasSupabase || typeof code !== "string" || !/^[A-Za-z0-9-]{4,20}$/.test(code)) return null;
  const { data } = await publicDb().rpc("group_link_progress", { p_code: code });
  return ((data as LinkProgress[] | null) ?? [])[0] ?? null;
}
