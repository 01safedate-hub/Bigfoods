import { ArrowRight, Boxes, Layers, Ship, Tag, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { SeaQuote } from "@/app/store/sea-quote";
import { CATEGORY_KEYS, CATEGORY_PAGES } from "@/lib/content/category-pages";
import { guideBySlug } from "@/lib/content/guides";
import { getProducts } from "@/lib/data/catalog";
import { naira } from "@/lib/format";
import { PRICING } from "@/lib/pricing/config";
import { breadcrumbs, faq, graph, SHOP_URL } from "@/lib/seo";
import { WholesaleGrid } from "./wholesale-grid";

const STORE = (process.env.NEXT_PUBLIC_STORE_URL ?? "https://fastchina.store").replace(/\/$/, "");
const MIN = PRICING.retailerMinQty;
const OFF = Math.round(PRICING.promos.retailer * 100);

export const metadata: Metadata = {
  title: { absolute: "China Wholesale Market in Nigeria: Buy 10+ for Less · FastChina" },
  description: `Buy wholesale from China in Naira. ${MIN}+ units of a product get the retailer price, with free delivery to your Jumia pickup station and sea freight by the CBM.`,
  keywords: ["China wholesale market Nigeria", "buy wholesale from China", "wholesale prices Nigeria", "bulk buy from China", "1688 wholesale Nigeria"],
  alternates: { canonical: "/wholesale" },
  openGraph: { type: "website", url: "/wholesale", title: "China wholesale market, in Naira", description: `${MIN}+ units at retailer prices. Free delivery to your pickup station.` },
};

const FAQ = [
  { q: "What is the minimum order for wholesale prices?", a: `${MIN} units of one product. Mix colours and sizes of the same product to reach ${MIN}. Below that you pay the normal price.` },
  { q: "Is delivery free on wholesale orders?", a: "Yes. Every marketplace order, wholesale included, ships free to your chosen Jumia pickup station." },
  { q: "Can I combine wholesale prices with coupons?", a: "Retailer prices are already our deepest regular discount, so coupons don't apply to 10+ items. You always get the single lowest price." },
  { q: "Can I pay small small on a wholesale order?", a: "Yes. Pay small small works on wholesale orders too: weekly payments over 4, 8 or 12 weeks, and we buy once it's fully paid." },
  { q: "How do I ship goods I bought from my own suppliers?", a: "Use wholesale sea freight: you get a China receiving address, suppliers deliver there, and we ship to Lagos by sea, priced per cubic metre (CBM)." },
];

export default async function WholesalePage() {
  const products = (await getProducts()).filter((p) => p.prices.retailer < p.prices.list);
  const present = new Set(products.map((p) => p.category));
  const categories = CATEGORY_KEYS.filter((k) => present.has(k)).map((k) => ({ key: k, name: CATEGORY_PAGES[k].name }));
  const best = products.reduce((m, p) => Math.max(m, (p.prices.list - p.prices.retailer) * MIN), 0);
  const guides = ["how-to-buy-wholesale-from-china", "best-products-to-import-from-china-to-nigeria", "shipping-from-china-to-nigeria-cost"].map(guideBySlug).filter((g) => g !== undefined);

  return (
    <div className="flex flex-col gap-8 pb-8 md:gap-12 md:pt-4">
      <JsonLd
        data={graph(
          breadcrumbs([["Home", "/"], ["Wholesale market", "/wholesale"]]),
          {
            "@type": "CollectionPage",
            "@id": `${SHOP_URL}/wholesale`,
            name: "FastChina wholesale market",
            description: `Retailer prices from ${MIN} units on products from China, delivered free in Nigeria.`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: products.length,
              itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SHOP_URL}/product/${p.slug}`, name: p.name })),
            },
          },
          faq(FAQ),
        )}
      />

      <section className="relative overflow-hidden bg-[#14120D] px-5 py-10 text-[#FBFAF6] md:rounded-md md:px-10 md:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#D9B866]/15 blur-3xl" />
        <div className="relative flex max-w-3xl flex-col gap-4">
          <span className="text-[11px] font-extrabold tracking-[0.16em] text-[#D9B866]">WHOLESALE MARKET</span>
          <h1 className="text-[30px] font-extrabold leading-[1.08] tracking-tight md:text-[48px]">Wholesale from China,<br />priced in Naira.</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-[#CFC8B6] md:text-[17px]">Buy {MIN} or more of any product and the retailer price applies automatically, up to {OFF}% off our margin. Free delivery to your Jumia pickup station, photo checks in China and Pay small small included.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href="#market" className="flex min-h-12 items-center gap-1.5 rounded-full bg-[#D9B866] px-6 text-[15px] font-bold text-[#14120D]">Shop wholesale <ArrowRight aria-hidden size={16} /></a>
            <a href="#sea" className="flex min-h-12 items-center rounded-full border border-[#4A4536] px-6 text-[15px] font-bold">Ship your own goods by sea</a>
          </div>
        </div>
        <dl className="relative mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[[`${MIN}+`, "units per product"], [`${OFF}%`, "off our margin"], ["₦0", "delivery"], [best ? naira(best) : "—", `top saving on ${MIN}`]].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-[#2C2920] bg-[#1B1912] p-3.5">
              <dt className="sr-only">{l}</dt>
              <dd className="flex flex-col gap-0.5"><strong className="text-[22px] tabular-nums text-[#F1E6C8]">{v}</strong><span className="text-[12px] text-[#A8A294]">{l}</span></dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="how-h" className="grid gap-3 px-3 sm:grid-cols-2 md:px-0 lg:grid-cols-4">
        <h2 id="how-h" className="sr-only">How wholesale works</h2>
        {[
          [Layers, `Reach ${MIN} units`, "Mix colours and sizes of one product. The price drops the moment your cart hits 10."],
          [Tag, "Lowest single price", "Retailer prices beat Midnight Drop and coupons. You always get the one lowest price, never stacked."],
          [Truck, "Free to your station", "Shipping, customs clearing and delivery to your Jumia pickup station are in the price."],
          [Boxes, "Checked in China", "Bulk orders are counted and photographed at our warehouse before they ship."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof Layers;
          return (
            <div key={t as string} className="flex gap-3 rounded-md bg-surface p-4">
              <I aria-hidden size={22} strokeWidth={1.7} className="mt-0.5 shrink-0 text-success" />
              <span className="flex flex-col gap-1"><strong className="text-[14px]">{t as string}</strong><span className="text-[13px] leading-relaxed text-muted">{d as string}</span></span>
            </div>
          );
        })}
      </section>

      <section id="market" aria-labelledby="market-h" className="flex scroll-mt-24 flex-col gap-3 px-3 md:px-0">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="market-h" className="text-[20px] font-extrabold md:text-[26px]">Retailer prices, today</h2>
          <span className="text-[12px] text-muted">Prices update with the yuan rate. The price at checkout is final.</span>
        </div>
        <WholesaleGrid products={products} categories={categories} />
      </section>

      <section id="sea" aria-labelledby="sea-h" className="grid scroll-mt-24 gap-8 bg-sea px-5 py-10 text-white md:rounded-md md:px-10 md:py-14 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.16em] text-[#9CC3E6]"><Ship aria-hidden size={14} /> SEA FREIGHT · YOUR OWN GOODS</span>
          <h2 id="sea-h" className="text-[26px] font-extrabold leading-tight md:text-[38px]">Bought from your own suppliers? Ship it with us by the CBM.</h2>
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
          {guides.map((g) => (
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
