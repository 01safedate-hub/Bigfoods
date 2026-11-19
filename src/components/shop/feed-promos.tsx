"use client";

import {
  ArrowRight, BadgePercent, Banknote, Coins, Crown, Gift, Globe, HandCoins, Laptop, Megaphone, PiggyBank, Rocket, Ship, ShoppingBag, Smartphone,
  Smile, Sparkles, Store, TrendingUp, Truck, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { SpotlightCard } from "./spotlight-card";

const STORE = (process.env.NEXT_PUBLIC_STORE_URL ?? "https://fastchina.store").replace(/\/$/, "");

/** Fifteen ways to say "sell with us": the feed shows a different one each visit. */
interface Promo { title: string; sub: string; cta: string; href: string; tone: string; person: LucideIcon; prop: LucideIcon }
const PROMOS: Promo[] = [
  { title: "Earn by selling these. Free.", sub: "Pick products, share your link, keep your profit.", cta: "Start free", href: `${STORE}/seller`, tone: "from-[#3B82F6] to-[#1D4ED8]", person: Smile, prop: Coins },
  { title: "Your own shop website, ₦0", sub: "20 products and your own link at no cost.", cta: "Open my store", href: `${STORE}/seller`, tone: "from-[#2563EB] to-[#1E3A8A]", person: Store, prop: Sparkles },
  { title: "Dropship for free with us", sub: "We buy, ship and deliver. You just sell.", cta: "How it works", href: `${STORE}/#dropship`, tone: "from-[#0EA5E9] to-[#1D4ED8]", person: Truck, prop: HandCoins },
  { title: "No stock. No shop rent.", sub: "Sell from your phone, get paid after delivery.", cta: "Try it", href: `${STORE}/seller`, tone: "from-[#6366F1] to-[#3730A3]", person: Smartphone, prop: Banknote },
  { title: "Set your price. Keep the difference.", sub: "You choose the markup on every product.", cta: "Start selling", href: `${STORE}/seller`, tone: "from-[#3B82F6] to-[#4338CA]", person: TrendingUp, prop: Coins },
  { title: "Side hustle, sorted", sub: "Share products on WhatsApp and earn weekly.", cta: "Get my link", href: `${STORE}/seller`, tone: "from-[#0284C7] to-[#1E40AF]", person: Megaphone, prop: PiggyBank },
  { title: "Stock your shop at factory prices", sub: "Wholesale by sea from 10 units.", cta: "Open wholesale", href: "/wholesale", tone: "from-[#E11D2E] to-[#7F0A15]", person: Ship, prop: ShoppingBag },
  { title: "Start a fashion business", sub: "A ready-made starter kit in one tap.", cta: "See the kit", href: "/wholesale", tone: "from-[#F43F5E] to-[#9F1239]", person: Gift, prop: Sparkles },
  { title: "Paid every Friday", sub: "Your profit lands in your bank weekly.", cta: "Become a seller", href: `${STORE}/seller`, tone: "from-[#2563EB] to-[#172554]", person: Banknote, prop: Smile },
  { title: "Turn followers into money", sub: "Post our products, earn on every sale.", cta: "Start free", href: `${STORE}/seller`, tone: "from-[#7C3AED] to-[#3B0764]", person: Megaphone, prop: Coins },
  { title: "Your brand. Your website.", sub: "Pro stores can use their own domain.", cta: "See plans", href: `${STORE}/#pricing`, tone: "from-[#1D4ED8] to-[#0F172A]", person: Globe, prop: Crown },
  { title: "Phones sell fast. Stock up.", sub: "Phone business starter kit, wholesale.", cta: "See the kit", href: "/wholesale", tone: "from-[#111827] to-[#374151]", person: Smartphone, prop: Rocket },
  { title: "Earn while you sleep", sub: "Your store sells 24/7. We deliver.", cta: "Open my store", href: `${STORE}/seller`, tone: "from-[#1E40AF] to-[#0C1A4B]", person: Laptop, prop: Sparkles },
  { title: "Buy 10+, pay less each", sub: "Wholesale prices for shop owners.", cta: "Shop wholesale", href: "/wholesale", tone: "from-[#DC2626] to-[#7F1D1D]", person: BadgePercent, prop: Coins },
  { title: "Be your own boss today", sub: "A free store in a minute. No card needed.", cta: "Let’s go", href: `${STORE}/seller`, tone: "from-[#0EA5E9] to-[#0369A1]", person: Rocket, prop: HandCoins },
];

// A per-visit offset, so the promos differ every time but don't change while you scroll.
let offset: number | null = null;
const readOffset = () => {
  if (offset !== null) return offset;
  try {
    const saved = sessionStorage.getItem("fc-promo");
    offset = saved ? Number(saved) : Math.floor(Math.random() * PROMOS.length);
    sessionStorage.setItem("fc-promo", String(offset));
  } catch {
    offset = 0;
  }
  return offset;
};
const usePromo = (slot: number) => PROMOS[(slot + useSyncExternalStore(() => () => {}, readOffset, () => 0)) % PROMOS.length];

/** A promo the size of a product card: a little character, floating coins, one line and a button. */
export function PromoTile({ slot }: { slot: number }) {
  const p = usePromo(slot);
  const Person = p.person;
  const Prop = p.prop;
  const external = p.href.startsWith("http");
  const body = (
    <>
      <span className={cn("relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded bg-gradient-to-br text-white", p.tone)}>
        <span aria-hidden className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-8 -left-4 size-28 rounded-full bg-white/10" />
        <span aria-hidden className="relative flex size-[46%] items-center justify-center rounded-full bg-white/15 ring-4 ring-white/10">
          <Person size={44} strokeWidth={1.6} />
        </span>
        <Prop aria-hidden size={22} className="promo-float absolute right-[16%] top-[18%] text-[#FDE68A]" />
        <Coins aria-hidden size={18} className="promo-float-slow absolute bottom-[20%] left-[16%] text-[#FDE68A]" />
        <Sparkles aria-hidden size={14} className="promo-float absolute left-[24%] top-[16%] text-white/80" />
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-ink">{external ? "FREE" : "WHOLESALE"}</span>
      </span>
      <span className="mt-1.5 flex flex-col gap-0.5 px-0.5">
        <strong className="line-clamp-2 text-[13px] leading-snug">{p.title}</strong>
        <span className="line-clamp-1 text-[11px] text-muted">{p.sub}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[12px] font-extrabold text-[#1D4ED8]">{p.cta} <ArrowRight aria-hidden size={13} /></span>
      </span>
    </>
  );
  return external ? <a href={p.href} className="flex min-w-0 flex-col">{body}</a> : <Link href={p.href} className="flex min-w-0 flex-col">{body}</Link>;
}

/** Big swipeable slot: a best seller, then the wholesale market, then free dropshipping. */
export function SpotlightCarousel({ product, rank, className }: { product?: Product; rank?: number; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const slides = [
    product && <SpotlightCard key="p" product={product} rank={rank} className="size-full" />,
    <AdSlide key="w" href="/wholesale" tone="from-[#F0283A] via-[#C8102E] to-[#6E0711]" kicker="WHOLESALE MARKET" title="Stock your shop at factory prices" sub="From 10 units per product, by sea. Starter kits for new businesses." cta="Open wholesale" icon={Ship} />,
    <AdSlide key="d" href={`${STORE}/seller`} tone="from-[#3B82F6] via-[#1D4ED8] to-[#172554]" kicker="DROPSHIP FOR FREE" title="Sell these products. Keep your profit." sub="Your own store website for ₦0. We buy, ship and deliver." cta="Start free" icon={HandCoins} external />,
  ].filter(Boolean);
  return (
    <div className={cn("relative", className)}>
      <div ref={track} className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto rounded-2xl">
        {slides.map((s, i) => <div key={i} className="size-full shrink-0 snap-center">{s}</div>)}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {slides.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-white/50")} />)}
      </div>
    </div>
  );
}

export function AdSlide({ href, tone, kicker, title, sub, cta, icon: Icon, external, className }: { href: string; tone: string; kicker: string; title: string; sub: string; cta: string; icon: LucideIcon; external?: boolean; className?: string }) {
  const inner = (
    <>
      <span aria-hidden className="absolute -right-10 -top-12 size-48 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-16 right-10 size-40 rounded-full bg-white/10" />
      <Icon aria-hidden size={88} strokeWidth={1.2} className="promo-float-slow absolute right-5 top-6 text-white/25" />
      <Coins aria-hidden size={26} className="promo-float absolute right-28 top-10 text-[#FDE68A]" />
      <span className="text-[11px] font-extrabold tracking-[0.14em] text-white/85">{kicker}</span>
      <span className="mt-auto flex flex-col gap-1">
        <strong className="max-w-[80%] text-[21px] font-extrabold leading-tight md:text-[26px]">{title}</strong>
        <span className="max-w-[85%] text-[13px] text-white/90">{sub}</span>
        <span className="mt-2 flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-ink">{cta} <ArrowRight aria-hidden size={14} /></span>
      </span>
    </>
  );
  const cls = cn("relative isolate flex size-full flex-col overflow-hidden bg-gradient-to-br p-4 pb-7 text-white", tone, className);
  return external ? <a href={href} className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>;
}
