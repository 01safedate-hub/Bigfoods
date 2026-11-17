import { Moon } from "lucide-react";
import Link from "next/link";
import { EventBanner } from "@/components/shop/event-banner";
import { TrustGrid } from "@/components/shop/footer";
import { ProductFeed } from "@/components/shop/product-feed";
import { ClearOutTile, CouponRow, FlashSale, MidnightStrip, RetailerTile } from "@/components/shop/promos";
import { Countdown } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { ProductIcon } from "@/components/ui/product-icon";
import { PRODUCTS } from "@/lib/catalog/products";

const BUBBLES = [
  ["gadgets", "Phones", "phone", "#E8E8F0"], ["hair", "Wigs", "wig", "#F3E9DC"], ["women", "Dresses", "dress", "#F6E3E6"],
  ["jewellery", "Watches", "watch", "#E3EEE8"], ["gadgets", "Audio", "audio", "#E7E6F3"], ["shoes", "Shoes", "shoe", "#F0ECE4"],
  ["bags", "Bags", "bag", "#F7E6EC"], ["beauty", "Beauty", "lipstick", "#F8E1E7"], ["furniture", "Furniture", "chair", "#ECECEC"],
  ["retailer", "Retailer", "gift", "#F6F1E4"],
] as const;

export default function HomePage() {
  const flash = PRODUCTS.filter((p) => p.flash);
  return (
    <div className="flex flex-col gap-3 pb-6 md:gap-6 md:pt-4">
      <div className="md:overflow-hidden md:rounded-md">
        <MidnightStrip />
      </div>

      <section aria-label="Featured" className="grid gap-2.5 px-3 md:grid-cols-3 md:px-0">
        <div className="md:col-span-2">
          <EventBanner />
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
          <Link key={label} href={`/categories?c=${slug}`} className="flex flex-col items-center gap-1 text-center">
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

      <div className="grid grid-cols-2 gap-2 px-3 md:hidden">
        <ClearOutTile />
        <RetailerTile />
      </div>
      <div className="hidden md:block">
        <RetailerTile />
      </div>

      <ProductFeed products={PRODUCTS} />

      <div className="px-3 md:px-0">
        <TrustGrid />
      </div>
    </div>
  );
}
