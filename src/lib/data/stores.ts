import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { PriceSet, Product } from "@/lib/catalog/types";
import { getProducts } from "@/lib/data/catalog";
import { type PlanKey, storePrice, type ThemeKey } from "@/lib/dropship/plans";
import { hasSupabase } from "@/lib/supabase/env";
import { publicDb } from "@/lib/supabase/server";

export interface PublicStore {
  id: string;
  slug: string;
  /** Short address set by staff (fastchina.store/<alias>). */
  alias?: string | null;
  name: string;
  tagline: string | null;
  accent: string;
  theme: ThemeKey;
  plan: PlanKey;
  status: "active" | "needs_upgrade" | "suspended";
  customDomain: string | null;
  /** The seller lets customers use Pay small small (default on). */
  allowSmallSmall: boolean;
}

export interface Listing {
  slug: string;
  markupType: "pct" | "fixed";
  markupValue: number;
}

/** Demo store so the storefront can be seen before the database is connected. */
const DEMO: { store: PublicStore; listings: Listing[] } = {
  store: { id: "demo", slug: "adas-closet", name: "Ada’s Closet", tagline: "Lagos girls, Lagos prices. Delivered to your Jumia station.", accent: "#C2410C", theme: "studio", plan: "free", status: "active", customDomain: null, allowSmallSmall: true },
  listings: ["satin-cowl-neck-midi-dress", "quilted-crossbody-chain-bag", "body-wave-lace-front-wig-22", "matte-liquid-lipstick-set", "mens-steel-quartz-watch", "chunky-platform-sneakers", "stainless-thorn-chain-necklace", "wireless-earbuds-enc"]
    .map((slug) => ({ slug, markupType: "pct" as const, markupValue: 25 })),
};

/** A storefront by its name or alias (fastchina.store/<name>), subdomain, or verified own domain. */
export async function getStore(key: string): Promise<{ store: PublicStore; listings: Listing[] } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("stores", `store:${key}`);
  if (!hasSupabase) {
    if (key === DEMO.store.slug) return DEMO;
    // Theme previews: /s/demo-noir, /s/demo-bloom, /s/demo-atelier, /s/demo-pulse
    const t = key.replace(/^demo-/, "") as ThemeKey;
    const look: Partial<Record<ThemeKey, Partial<PublicStore>>> = {
      noir: { name: "Maison Ọba", tagline: "Watches, wigs and evening wear. Quietly expensive.", accent: "#C9A44C" },
      bloom: { name: "Little Bloom", tagline: "Soft things for little ones and the people who love them.", accent: "#D9577A" },
      atelier: { name: "Atelier Ẹwà", tagline: "An edit of pieces worth keeping, chosen every week.", accent: "#7A4E2D" },
      pulse: { name: "VOLT", tagline: "Gadgets, kicks and loud colour. Free delivery nationwide.", accent: "#7C3AED" },
    };
    return look[t] ? { store: { ...DEMO.store, ...look[t], theme: t, plan: "elite", slug: key }, listings: DEMO.listings } : null;
  }
  const db = publicDb();
  const q = db.from("stores").select("id, slug, alias, name, tagline, accent, theme, plan, status, custom_domain, domain_verified, allow_small_small");
  const k = key.toLowerCase();
  const { data: s } = await (k.includes(".") ? q.eq("custom_domain", k).eq("domain_verified", true) : /^[a-z0-9-]{3,40}$/.test(k) ? q.or(`slug.eq.${k},alias.eq.${k}`) : q.eq("slug", "-")).maybeSingle();
  if (!s || s.status === "suspended") return null;
  const { data: rows } = await db.from("store_products").select("markup_type, markup_value, sort, products!inner(slug, status)").eq("store_id", s.id).eq("active", true).order("sort").order("created_at");
  return {
    store: { id: s.id, slug: s.slug, alias: s.alias ?? null, name: s.name, tagline: s.tagline, accent: s.accent, theme: s.theme, plan: s.plan, status: s.status, customDomain: s.domain_verified ? s.custom_domain : null, allowSmallSmall: s.allow_small_small !== false },
    listings: (rows ?? [])
      .filter((r) => (r.products as unknown as { status: string }).status === "active")
      .map((r) => ({ slug: (r.products as unknown as { slug: string }).slug, markupType: r.markup_type, markupValue: Number(r.markup_value) })),
  };
}

/** One fixed price per variant: FastChina's list price plus the seller's markup (no promos on store prices). */
export function sellerPrices(p: PriceSet, l: Pick<Listing, "markupType" | "markupValue">): PriceSet {
  const { price } = storePrice(p.list, l.markupType, l.markupValue);
  return { list: price, midnight: price, event: price, flash: price, retailer: price };
}

/** The store's products, priced at the seller's prices. */
export async function getStoreProducts(listings: Listing[]): Promise<Product[]> {
  const all = await getProducts();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return listings.flatMap((l) => {
    const p = bySlug.get(l.slug);
    if (!p) return [];
    return [{ ...p, prices: sellerPrices(p.prices, l), flash: undefined, badge: undefined, variants: p.variants.map((v) => ({ ...v, prices: sellerPrices(v.prices, l) })) }];
  });
}
