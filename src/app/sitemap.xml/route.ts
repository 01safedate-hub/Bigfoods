import { CATEGORY_KEYS } from "@/lib/content/category-pages";
import { GUIDES } from "@/lib/content/guides";
import { LEGAL } from "@/lib/content/legal";
import { getProducts } from "@/lib/data/catalog";
import { getStore, getStoreProducts } from "@/lib/data/stores";
import { siteFor } from "@/lib/hosts";
import { hasSupabase } from "@/lib/supabase/env";
import { publicDb } from "@/lib/supabase/server";
import { SHOP_URL, STORE_URL } from "@/lib/seo";
import { type SitemapEntry, sitemapXml } from "@/lib/sitemap-xml";

const latestGuide = GUIDES.map((g) => g.updated).sort().at(-1);

async function shopEntries(): Promise<SitemapEntry[]> {
  const products = await getProducts();
  return [
    { url: SHOP_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SHOP_URL}/wholesale`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SHOP_URL}/deals`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SHOP_URL}/categories`, changeFrequency: "daily", priority: 0.7 },
    ...CATEGORY_KEYS.map((k): SitemapEntry => ({ url: `${SHOP_URL}/category/${k}`, changeFrequency: "daily", priority: 0.8 })),
    { url: `${SHOP_URL}/guides`, lastModified: latestGuide, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g): SitemapEntry => ({ url: `${SHOP_URL}/guides/${g.slug}`, lastModified: g.updated, changeFrequency: "monthly", priority: 0.8 })),
    ...products.map((p): SitemapEntry => ({ url: `${SHOP_URL}/product/${p.slug}`, changeFrequency: "daily", priority: 0.6, images: p.images })),
    ...Object.keys(LEGAL).map((k): SitemapEntry => ({ url: `${SHOP_URL}/legal/${k}`, changeFrequency: "yearly", priority: 0.2 })),
  ];
}

async function sellerEntries(key: string, origin: string): Promise<SitemapEntry[]> {
  const found = await getStore(key);
  if (!found || found.store.status !== "active" || found.store.id === "demo" || found.store.slug.startsWith("demo-")) return [];
  const products = await getStoreProducts(found.listings);
  return [
    { url: `${origin}/`, changeFrequency: "daily", priority: 1 },
    ...products.map((p): SitemapEntry => ({ url: `${origin}/p/${p.slug}`, changeFrequency: "daily", priority: 0.7, images: p.images })),
  ];
}

/** fastchina.store: the dropship site plus every live store at fastchina.store/<name>. */
async function storeEntries(): Promise<SitemapEntry[]> {
  const base: SitemapEntry[] = [{ url: `${STORE_URL}/`, changeFrequency: "weekly", priority: 1 }];
  if (!hasSupabase) return base;
  const { data } = await publicDb().from("stores").select("slug, alias, custom_domain, domain_verified").eq("status", "active").limit(5000);
  return [
    ...base,
    ...(data ?? []).filter((s) => !(s.custom_domain && s.domain_verified)).map((s): SitemapEntry => ({ url: `${STORE_URL}/${s.alias || s.slug}`, changeFrequency: "daily", priority: 0.6 })),
  ];
}

/** One sitemap per domain: the marketplace, fastchina.store, and every seller's store. */
export async function GET(request: Request) {
  const site = siteFor(request.headers.get("host"));
  const entries =
    site.kind === "shop" ? await shopEntries()
    : site.kind === "store" ? await storeEntries()
    : await sellerEntries(site.key, site.origin);
  return new Response(sitemapXml(entries), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
