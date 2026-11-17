import type { MetadataRoute } from "next";
import { LEGAL } from "@/lib/content/legal";
import { getProducts } from "@/lib/data/catalog";

const BASE = "https://fastchina.shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/deals`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/categories`, changeFrequency: "daily", priority: 0.7 },
    ...products.map((p) => ({ url: `${BASE}/product/${p.slug}`, changeFrequency: "daily" as const, priority: 0.6, images: p.images.slice(0, 1) })),
    ...Object.keys(LEGAL).map((k) => ({ url: `${BASE}/legal/${k}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
