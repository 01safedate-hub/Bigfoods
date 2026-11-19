import { ArrowRight, Boxes, Layers, Ship, Tag, Truck } from "lucide-react";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { SeaQuote } from "@/app/store/sea-quote";
import { CATEGORY_KEYS } from "@/lib/content/category-pages";
import { guideBySlug } from "@/lib/content/guides";
import { getKitRows, getProducts } from "@/lib/data/catalog";
import { breadcrumbs, faq, graph, SHOP_URL } from "@/lib/seo";
import type { CategoryKey } from "@/lib/pricing/engine";
import { DEFAULT_KITS, type Kit, MIN_QTY as WMIN } from "@/lib/wholesale/rules";
import { WholesaleMarket } from "./market";

const STORE = (process.env.NEXT_PUBLIC_STORE_URL ?? "https://fastchina.store").replace(/\/$/, "");
const MIN = WMIN;
const GUIDES = ["how-to-buy-wholesale-from-china", "best-products-to-import-from-china-to-nigeria", "shipping-from-china-to-nigeria-cost"];

export const metadata: Metadata = {
  title: { absolute: "China Wholesale Market in Nigeria: Factory Stock by Sea · FastChina" },
  description: `Buy stock for your shop from China in Naira. Wholesale prices from ${MIN} units per product, shipped by sea with clearing and delivery to your Jumia pickup station included.`,
  keywords: ["China wholesale market Nigeria", "buy wholesale from China", "wholesale prices Nigeria", "bulk buy from China", "start a business stock Nigeria"],
  alternates: { canonical: "/wholesale" },
  openGraph: { type: "website", url: "/wholesale", title: "FastChina wholesale market", description: `Factory stock by sea, from ${MIN} units per product.` },
};

const FAQ = [
  { q: "What is the minimum order?", a: `${MIN} units of each product. Mix colours and sizes of the same product to reach ${MIN}.` },
  { q: "How long does wholesale delivery take?", a: "Wholesale goods ship by sea and reach your pickup station about 90 days after full payment, sometimes up to 120 days. That’s why wholesale prices are much lower than single-item prices." },
  { q: "What’s included in the price?", a: "The goods, sea freight, customs clearing, weighing and handling, and delivery to your Jumia pickup station. Nothing more to pay on arrival." },
  { q: "Can I use coupons or points?", a: "No. Wholesale prices are already our lowest, so coupons, points and sale promotions don’t apply." },
  { q: "Can I pay small small?", a: "Yes. Pay weekly over 4, 8 or 12 weeks at 0% interest. We order your stock when it’s fully paid." },
  { q: "What are starter kits?", a: "Ready-made stock lists for a new shop, filled automatically with our best sellers in that line. Add a kit, then remove or add products in your wholesale cart." },
];

export default function WholesalePage() {
  return (
    <div className="flex flex-col gap-6 pb-8 md:gap-8 md:pt-4">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#E11D2E] via-[#C8102E] to-[#7F0A15] px-5 pt-8 pb-7 text-white md:rounded-2xl md:px-10 md:py-12">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-[#FFB4A8]/20 blur-3xl" />
        <div className="relative flex max-w-3xl flex-col gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.16em] text-[#FFD7D2]"><Ship aria-hidden size={14} /> WHOLESALE MARKET · SEA FREIGHT</span>
          <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-[50px]">Stock your shop<br />at factory prices.</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/90 md:text-[17px]">From {MIN} units per product. Shipped by sea with clearing, handling and delivery to your Jumia pickup station already in the price. Arrives in about 90 days.</p>
        </div>
        <dl className="relative mt-6 grid max-w-3xl grid-cols-3 gap-2">
          {[[`${MIN}+`, "units per product"], ["90+", "days by sea"], ["₦0", "extra on arrival"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-white/12 p-3 backdrop-blur">
              <dt className="sr-only">{l}</dt>
              <dd className="flex flex-col"><strong className="text-[22px] tabular-nums">{v}</strong><span className="text-[11px] text-white/80">{l}</span></dd>
            </div>
          ))}
        </dl>
      </section>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Market />
      </Suspense>

      <section aria-labelledby="how-h" className="grid gap-3 px-3 sm:grid-cols-2 md:px-0 lg:grid-cols-4">
        <h2 id="how-h" className="sr-only">How wholesale works</h2>
        {[
          [Layers, `${MIN} units per product`, "Mix colours and sizes of one product to reach it. Add as many products as you like."],
          [Tag, "One clear price", "Goods, sea freight, clearing, weighing and local delivery are all inside the unit price."],
          [Truck, "To your pickup station", "Collected at your Jumia pickup station with a code and ID, like any order."],
          [Boxes, "Counted in China", "Bulk orders are counted and photographed at our warehouse before they sail."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof Layers;
          return (
            <div key={t as string} className="flex gap-3 rounded-xl bg-surface p-4">
              <I aria-hidden size={22} strokeWidth={1.7} className="mt-0.5 shrink-0 text-sale" />
              <span className="flex flex-col gap-1"><strong className="text-[14px]">{t as string}</strong><span className="text-[13px] leading-relaxed text-muted">{d as string}</span></span>
            </div>
          );
        })}
      </section>

      <section id="sea" aria-labelledby="sea-h" className="grid scroll-mt-24 gap-8 bg-sea px-5 py-10 text-white md:rounded-md md:px-10 md:py-14 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.16em] text-[#9CC3E6]"><Ship aria-hidden size={14} /> SEA FREIGHT · YOUR OWN GOODS</span>
          <h2 id="sea-h" className="text-[26px] font-extrabold leading-tight md:text-[38px]">Have your own suppliers? Ship with us by the CBM.</h2>
          <p className="text-[15px] leading-relaxed text-[#C9D6E4]">Verified businesses get a personal receiving address in Guangzhou. Your suppliers deliver there; we log every carton with photos and volume, consolidate, and sail to Lagos. Plan for 90 days or more.</p>
          <ul className="flex flex-col gap-2 text-[14px] text-[#E2EAF2]">
            <li>• Priced per cubic metre (CBM), from 0.5 CBM</li>
            <li>• Clearing and handling quoted upfront</li>
            <li>• A 20ft container holds about 28 CBM</li>
          </ul>
        </div>
        <SeaQuote cta={{ label: "Get a China receiving address", href: `${STORE}/#wholesale` }} />
      </section>

      <div className="grid gap-6 px-3 md:grid-cols-2 md:px-0">
        <section aria-labelledby="faq-h" className="flex flex-col gap-2">
          <h2 id="faq-h" className="text-[18px] font-extrabold">Wholesale questions</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-lg border border-line px-4 py-3 text-[14px] open:bg-surface">
              <summary className="cursor-pointer font-bold">{f.q}</summary>
              <p className="pt-1.5 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </section>
        <section aria-labelledby="learn-h" className="flex flex-col gap-2">
          <h2 id="learn-h" className="text-[18px] font-extrabold">Before you buy in bulk</h2>
          {GUIDES.map(guideBySlug).filter((g) => g !== undefined).map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-[14px] font-semibold hover:border-ink">
              {g.h1} <ArrowRight aria-hidden size={15} className="shrink-0" />
            </Link>
          ))}
          <a href={STORE} className="flex items-center justify-between gap-3 rounded-lg bg-gold-soft px-4 py-3 text-[14px] font-semibold text-gold-ink">
            Rather not hold stock? Start a free dropship store <ArrowRight aria-hidden size={15} className="shrink-0" />
          </a>
        </section>
      </div>
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
            description: `Factory stock by sea, from ${MIN} units per product, delivered to Jumia pickup stations in Nigeria.`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: products.length,
              itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SHOP_URL}/product/${p.slug}`, name: p.name })),
            },
          },
          faq(FAQ),
        )}
      />
      <WholesaleMarket products={products} categories={categories} kits={kits} />
    </>
  );
}
