import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { CATEGORY_KEYS } from "@/lib/content/category-pages";
import { getKitRows, getProducts } from "@/lib/data/catalog";
import { breadcrumbs, graph, SHOP_URL } from "@/lib/seo";
import type { CategoryKey } from "@/lib/pricing/engine";
import { DEFAULT_KITS, type Kit, MIN_QTY as WMIN } from "@/lib/wholesale/rules";
import { WholesaleMarket } from "./market";

const MIN = WMIN;

export const metadata: Metadata = {
  title: { absolute: "China Wholesale Market in Nigeria: Factory Stock by Sea · FastChina" },
  description: `Buy stock for your shop from China in Naira. Wholesale prices from ${MIN} units per product, shipped by sea with customs clearing included.`,
  keywords: ["China wholesale market Nigeria", "buy wholesale from China", "wholesale prices Nigeria", "bulk buy from China", "start a business stock Nigeria"],
  alternates: { canonical: "/wholesale" },
  openGraph: { type: "website", url: "/wholesale", title: "FastChina wholesale market", description: `Factory stock by sea, from ${MIN} units per product.` },
};


export default function WholesalePage() {
  return (
    <div className="flex flex-col gap-3 pb-8 md:gap-5 md:pt-4">
      <h1 className="sr-only">FastChina wholesale market: factory stock for your shop, by sea</h1>
      {/* Welcome banner, full width on phones and wide screens alike. */}
      <Image
        src="/brand/welcome-wholesale.webp"
        alt="Chinese market brought to you by FastChina: sourcing for business owners"
        width={1600}
        height={900}
        priority
        sizes="(min-width: 1360px) 1312px, 100vw"
        className="aspect-[16/9] h-auto w-full object-cover md:aspect-[16/7] md:rounded-2xl"
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Market />
      </Suspense>
    </div>
  );
}

async function Market() {
  const [all, kitRows] = await Promise.all([getProducts(), getKitRows()]);
  const products = all.filter((p) => p.wholesale && p.wholesaleFrom > 0 && Number.isFinite(p.wholesaleFrom));
  const present = new Set(products.map((p) => p.category));
  const categories = CATEGORY_KEYS.filter((k) => present.has(k));
  const kits: Kit[] = kitRows
    ? kitRows.map((k) => ({ slug: k.slug, title: k.title, subtitle: k.subtitle ?? "", tone: k.tone as Kit["tone"], categories: k.categories as CategoryKey[], maxProducts: k.max_products, unitsEach: k.units_each }))
    : DEFAULT_KITS;
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbs([["Home", "/"], ["Wholesale market", "/wholesale"]]),
          {
            "@type": "CollectionPage",
            "@id": `${SHOP_URL}/wholesale`,
            name: "FastChina wholesale market",
            description: `Factory stock by sea, from ${MIN} units per product, cleared in Lagos and delivered across Nigeria.`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: products.length,
              itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SHOP_URL}/wholesale/p/${p.slug}`, name: p.name })),
            },
          },
        )}
      />
      <WholesaleMarket products={products} categories={categories} kits={kits} />
    </>
  );
}
