"use server";

import { getQuoteLines, type LineRequest } from "@/lib/data/catalog";
import { getStore } from "@/lib/data/stores";
import { storePrice } from "@/lib/dropship/plans";
import { planOptions } from "@/lib/payments/instalments";
import { allow, TOO_MANY } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

const normalisePhone = (raw: unknown) => {
  if (typeof raw !== "string") return null;
  const d = raw.replace(/\D/g, "");
  const e = d.startsWith("234") ? d : d.startsWith("0") ? `234${d.slice(1)}` : d;
  return /^234[789][01]\d{8}$/.test(e) ? `+${e}` : null;
};

/**
 * Places an order in a seller's store. Each item is priced here: FastChina's list price plus the
 * seller's current markup. The browser only says what's in the bag.
 */
export async function placeStoreOrder(input: { store: string; items: LineRequest[]; stationId: string; phone: string; mode: "full" | "small"; weeks?: number }):
  Promise<{ ok: true; code: string } | { ok: false; message: string }> {
  const phone = normalisePhone(input?.phone);
  if (!phone) return { ok: false, message: "Enter a Nigerian phone number for delivery updates." };
  if (input.mode !== "full" && input.mode !== "small") return { ok: false, message: "Choose how to pay." };
  if (!hasSupabase) return { ok: false, message: "Demo store: orders turn on when the database is connected." };
  if (!(await allow("store-order", 10, 600))) return { ok: false, message: TOO_MANY };
  const found = await getStore(String(input.store));
  if (!found) return { ok: false, message: "This store isn’t available." };
  if (found.store.status !== "active") return { ok: false, message: "This store isn’t taking orders right now." };
  const listing = new Map(found.listings.map((l) => [l.slug, l]));
  const items = (Array.isArray(input.items) ? input.items : []).filter((i) => listing.has(i.slug)).slice(0, 50);
  if (!items.length) return { ok: false, message: "Your bag is empty." };

  const lines = await getQuoteLines(items);
  if (lines.length !== items.length) return { ok: false, message: "Something in your bag sold out or changed. Please check it." };
  const priced = lines.map((l) => {
    const li = listing.get(l.slug)!;
    const { price, markup } = storePrice(l.prices.list, li.markupType, li.markupValue);
    return { l, price, markup };
  });
  const total = priced.reduce((s, x) => s + x.price * x.l.qty, 0);
  let weeks: number | null = null;
  if (input.mode === "small") {
    weeks = Number(input.weeks);
    if (!planOptions(total).includes(weeks)) return { ok: false, message: "That plan length isn’t available for this total." };
  }
  const user = await getSessionUser();
  const { data, error } = await secretDb().rpc("place_store_order", {
    p_store: found.store.id, p_customer: user?.id ?? null, p_station: input.stationId, p_phone: phone, p_mode: input.mode, p_total: total, p_weeks: weeks,
    p_items: priced.map(({ l, price, markup }) => ({
      sku_id: l.variantId, qty: l.qty, unit: price, cost: Math.round(l.cost), title: l.title ?? l.slug, variant: l.variantLabel ?? "", ship: l.shipMode ?? "air", markup,
    })),
  });
  if (error) return { ok: false, message: error.message.includes("can’t take orders") ? "This store isn’t taking orders right now." : "We couldn’t place your order. Please try again." };
  return { ok: true, code: (data as { code: string }[])[0].code };
}

/** Counts a storefront visit (once per browser session; for the seller's dashboard). */
export async function recordVisit(storeId: unknown): Promise<void> {
  if (!hasSupabase || typeof storeId !== "string" || !/^[0-9a-f-]{36}$/.test(storeId)) return;
  if (!(await allow(`visit:${storeId}`, 30, 3600))) return;
  await secretDb().rpc("record_store_visit", { p_store: storeId });
}
