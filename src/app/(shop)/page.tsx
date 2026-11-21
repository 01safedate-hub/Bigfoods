import { Check, ChevronRight, Moon } from "lucide-react";
import { BestSellers } from "@/components/shop/best-sellers";
import { categoryRanks } from "@/components/shop/spotlight-card";
import Link from "next/link";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { TrustGrid } from "@/components/shop/footer";
import { ProductFeed } from "@/components/shop/product-feed";
import { ClearOutTile, CouponRow, FlashSale, MidnightStrip, RetailerTile } from "@/components/shop/promos";
import { Countdown } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { ProductIcon } from "@/components/ui/product-icon";
import { JsonLd } from "@/components/seo/json-ld";
import { getProducts } from "@/lib/data/catalog";
import { CATEGORY_PAGES } from "@/lib/content/category-pages";
import { GUIDES } from "@/lib/content/guides";
import { graph, organization, website } from "@/lib/seo";

const BUBBLES = [
  ["gadgets", "Phones", "phone", "#E8E8F0"], ["hair", "Wigs", "wig", "#F3E9DC"], ["fashion", "Dresses", "dress", "#F6E3E6"],
  ["jewellery", "Watches", "watch", "#E3EEE8"], ["audio", "Audio", "audio", "#E7E6F3"], ["shoes", "Shoes", "shoe", "#F0ECE4"],
  ["bags", "Bags", "bag", "#F7E6EC"], ["beauty", "Beauty", "lipstick", "#F8E1E7"], ["furniture", "Furniture", "chair", "#ECECEC"],
  ["wholesale", "Wholesale", "gift", "#F6F1E4"],
] as const;

export default async function HomePage() {
  const products = await getProducts();
  const flash = products.filter((p) => p.flash);
  return (
    <div className="flex flex-col gap-3 pb-6 md:gap-6 md:pt-4">
      <JsonLd data={graph(organization(), website())} />
      <h1 className="sr-only">Buy from China in Nigeria at factory prices, with free shipping to your Jumia pickup station</h1>
      <Link href="/why-fastchina" className="no-scrollbar flex items-center gap-3 overflow-x-auto whitespace-nowrap bg-[#FBF1E6] px-3 py-2 text-[13px] font-semibold text-success md:rounded-md">
        {["Free shipping", "Delivered or refunded", "7-day returns if damaged", "Photo check in China"].map((t, i) => (
          <span key={t} className={i ? "flex items-center gap-1 border-l border-[#E6D6C3] pl-3" : "flex items-center gap-1"}><Check aria-hidden size={15} strokeWidth={2.6} />{t}</span>
        ))}
        <ChevronRight aria-hidden size={16} className="ml-auto shrink-0" />
      </Link>

      <div className="md:overflow-hidden md:rounded-md">
        <MidnightStrip />
      </div>

      <section aria-label="Featured" className="grid gap-2.5 px-3 md:grid-cols-3 md:px-0">
        <div className="min-w-0 md:col-span-2">
          <HeroCarousel />
        </div>
        <div className="hidden grid-rows-2 gap-2.5 md:grid">
          <div className="flex flex-col justify-between gap-2 rounded-md bg-night p-5 text-white">
            <span className="flex items-center justify-between text-[11px] font-extrabold tracking-[0.14em] text-night-soft">
              <span className="flex items-center gap-1.5">
                <Moon aria-hidden size={14} /> MIDNIGHT DROP · 12AM–4AM
              </span>
              <InfoButton topic="midnight" />
            </span>
            <strong className="text-xl leading-snug">Every night, we cut our profit by 20% on everything.</strong>
            <span className="flex items-center justify-between text-xs text-[#C7C9E0]">
              Prices drop by themselves. <Countdown target="midnight" className="rounded bg-white/15 px-2 py-1 text-sm font-extrabold text-white" />
            </span>
          </div>
          <ClearOutTile />
        </div>
      </section>

      <section aria-label="Claim coupons" className="flex flex-col gap-2 px-3 md:px-0">
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <h2 className="text-[15px] font-bold md:text-lg">Claim your coupons</h2>
            <InfoButton topic="coupons" />
          </span>
          <Link href="/deals" className="text-xs text-muted">
            All ›
          </Link>
        </div>
        <CouponRow compact />
      </section>

      <section aria-label="Shop by category" className="grid grid-cols-5 gap-x-1 gap-y-2.5 px-2 md:grid-cols-10 md:px-0">
        {BUBBLES.map(([slug, label, icon, tint]) => (
          <Link key={label} href={slug === "wholesale" ? "/wholesale" : `/category/${slug}`} className="flex flex-col items-center gap-1 text-center">
            <span className="flex size-14 items-center justify-center rounded-full md:size-20" style={{ background: tint }}>
              <ProductIcon icon={icon} size={28} className="text-ink/70" />
            </span>
            <span className="text-[11px] leading-tight md:text-xs">{label}</span>
          </Link>
        ))}
      </section>

      <div className="px-3 md:px-0">
        <FlashSale products={flash} />
      </div>

      <BestSellers products={[...products].sort((a, b) => b.sold - a.sold).slice(0, 6)} ranks={Object.fromEntries(categoryRanks(products))} />

      <div className="grid grid-cols-2 gap-2 px-3 md:hidden">
        <ClearOutTile />
        <RetailerTile />
      </div>
      <div className="hidden md:block">
        <RetailerTile />
      </div>

      <ProductFeed products={products} />

      <div className="px-3 md:px-0">
        <TrustGrid />
      </div>

      <section aria-labelledby="about-h" className="mx-3 grid gap-6 rounded-md border border-line p-5 text-[13px] leading-relaxed text-muted md:mx-0 md:grid-cols-[1.4fr_1fr_1fr] md:p-7">
        <div className="flex flex-col gap-2">
          <h2 id="about-h" className="text-[15px] font-extrabold text-ink">Buy from China in Nigeria, without the stress</h2>
          <p>FastChina brings China’s factory prices to Nigeria in Naira. We buy from the factory, photograph your item at our China warehouse, ship it by air (10+ days) or sea for big items (90+ days), clear customs and deliver free to your nearest Jumia pickup station.</p>
          <p>Pay in full, Pay small small (any amount, any time, no deadlines), or split the cost with friends using Group pay. Reselling? Buy 10 or more of an item at the <Link href="/wholesale" className="font-semibold text-ink underline">wholesale price</Link>, or open a <a href="https://fastchina.store" className="font-semibold text-ink underline">free dropshipping store</a>.</p>
        </div>
        <nav aria-label="Shop by category" className="flex flex-col gap-1.5">
          <strong className="text-ink">Popular categories</strong>
          {Object.entries(CATEGORY_PAGES).slice(0, 8).map(([k, c]) => <Link key={k} href={`/category/${k}`}>{c.name} from China</Link>)}
        </nav>
        <nav aria-label="Guides" className="flex flex-col gap-1.5">
          <strong className="text-ink">Guides</strong>
          {GUIDES.slice(0, 6).map((g) => <Link key={g.slug} href={`/guides/${g.slug}`}>{g.h1}</Link>)}
          <Link href="/guides" className="font-semibold text-ink">All guides ›</Link>
        </nav>
      </section>
    </div>
  );
}
