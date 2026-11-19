"use server";

import { getWholesaleLines, type LineRequest } from "@/lib/data/catalog";
import { planOptions } from "@/lib/payments/instalments";
import { allow, TOO_MANY } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";
import { MIN_QTY, shortProducts } from "@/lib/wholesale/rules";

const MAX_LINES = 80;

function clean(items: unknown): LineRequest[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LINES).flatMap((i) => {
    const slug = typeof i?.slug === "string" ? i.slug.slice(0, 200) : "";
    const variantId = typeof i?.variantId === "string" ? i.variantId.slice(0, 200) : "";
    const qty = Number.isInteger(i?.qty) ? Math.min(9999, Math.max(1, i.qty)) : 0;
    return slug && variantId && qty ? [{ slug, variantId, qty }] : [];
  });
}

function normalisePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const d = raw.replace(/\D/g, "");
  const e164 = d.startsWith("234") ? d : d.startsWith("0") ? `234${d.slice(1)}` : d;
  return /^234[789][01]\d{8}$/.test(e164) ? `+${e164}` : null;
}

export interface WholesaleQuote {
  lines: { slug: string; variantId: string; qty: number; unit: number }[];
  missing: number;
  short: string[];
  total: number;
  plans: number[];
}

/** Current wholesale prices for the cart (they move with the yuan rate). */
export async function quoteWholesale(items: unknown): Promise<WholesaleQuote> {
  const req = clean(items);
  const lines = await getWholesaleLines(req);
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  return {
    lines: lines.map(({ slug, variantId, qty, unit }) => ({ slug, variantId, qty, unit })),
    missing: req.length - lines.length,
    short: shortProducts(lines),
    total,
    plans: total > 0 ? planOptions(total) : [],
  };
}

type PlaceResult = { ok: true; code: string } | { ok: false; message: string; demo?: boolean };

/**
 * Places a wholesale order: re-priced here from the database, sea only, at least the minimum
 * of each product, no coupons or points. The database checks the same rules again.
 */
export async function placeWholesaleOrder(input: { items: unknown; stationId: unknown; phone: unknown; mode: unknown; weeks?: unknown }): Promise<PlaceResult> {
  const phone = normalisePhone(input?.phone);
  if (!phone) return { ok: false, message: "Enter a Nigerian phone number for order updates." };
  if (input.mode !== "full" && input.mode !== "small") return { ok: false, message: "Choose how to pay." };
  if (typeof input.stationId !== "string" || !input.stationId) return { ok: false, message: "Choose a pickup station." };
  if (!hasSupabase) return { ok: false, demo: true, message: "Demo mode: orders turn on when the database is connected." };
  if (!(await allow("wholesale-order", 6, 600))) return { ok: false, message: TOO_MANY };

  const req = clean(input.items);
  const lines = await getWholesaleLines(req);
  if (!lines.length) return { ok: false, message: "Your wholesale cart is empty." };
  if (lines.length !== req.length) return { ok: false, message: "Some items changed or are no longer in the wholesale market. Check your cart." };
  const short = shortProducts(lines);
  if (short.length) return { ok: false, message: `Add at least ${MIN_QTY} of each product (mix colours and sizes to reach it).` };
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  let weeks: number | null = null;
  if (input.mode === "small") {
    weeks = Number(input.weeks);
    if (!planOptions(total).includes(weeks)) return { ok: false, message: "That plan length isn’t available for this total." };
  }
  const user = await getSessionUser();
  const { data, error } = await secretDb().rpc("place_order", {
    p_customer: user?.id ?? null,
    p_station: input.stationId,
    p_phone: phone,
    p_mode: input.mode,
    p_total: total,
    p_coupon: null,
    p_coupon_amount: 0,
    p_points: 0,
    p_weeks: weeks,
    p_channel: "wholesale",
    p_items: lines.map((l) => ({ sku_id: l.variantId, qty: l.qty, unit: l.unit, cost: Math.round(l.cost), title: l.title, variant: l.variantLabel, ship: "sea" })),
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, code: (data as { code: string }[])[0].code };
}
