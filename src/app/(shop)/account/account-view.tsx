"use client";

import {
  Box, CalendarCheck, Headphones, Link2, Mail, MapPin, MessageSquare, Package, Plane, RotateCcw, ScrollText, Settings, Star, Store, UserPlus, Wallet, X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { Countdown } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { Progress } from "@/components/ui/progress";
import { useNow } from "@/hooks/use-now";
import { productBySlug } from "@/lib/catalog/products";
import { cn } from "@/lib/format";
import { addDaysLabel } from "@/lib/time";

const ORDER_TABS = [
  { label: "Unpaid", icon: Wallet, n: 1 }, { label: "Processing", icon: Box, n: 2 }, { label: "Shipped", icon: Plane, n: 1 },
  { label: "Review", icon: Star, n: 0 }, { label: "Returns", icon: RotateCcw, n: 0 },
];
const STEPS = ["Paid", "Bought", "QC", "In the air", "Customs", "Station"];
const SERVICES = [
  { label: "Customer service", icon: Headphones, href: "/account" }, { label: "Check in", icon: CalendarCheck, href: "/deals", dot: true },
  { label: "My questions", icon: MessageSquare, href: "/product/amoled-android-phone-5g#qa", dot: true }, { label: "Pickup stations", icon: MapPin, href: "/checkout" },
  { label: "Invite friends", icon: UserPlus, href: "/account" }, { label: "Retailer Hub", icon: Package, href: "/categories?c=retailer" },
  { label: "Request a product", icon: Link2, href: "/search" }, { label: "Open a store", icon: Store, href: "/store" },
];

export function AccountView() {
  const now = useNow(60_000);
  const [banner, setBanner] = useState(true);
  const cheaper = ["mens-steel-quartz-watch", "wireless-earbuds-enc", "quilted-crossbody-chain-bag", "chunky-platform-sneakers"].map((s) => productBySlug(s)!);
  const current = 3;

  return (
    <div className="flex flex-col gap-2 bg-surface pb-6 md:grid md:grid-cols-[340px_1fr] md:items-start md:gap-6 md:bg-transparent md:pt-6">
      <div className="flex flex-col gap-2 md:sticky md:top-32">
        {banner && (
          <div className="flex items-center gap-2 bg-[#E3ECF8] py-1.5 pr-1.5 pl-3 md:rounded-md">
            <Mail aria-hidden size={18} />
            <span className="flex-1">Get 100 points for verifying your email</span>
            <button type="button" aria-label="Dismiss" onClick={() => setBanner(false)} className="flex size-9 items-center justify-center text-muted"><X aria-hidden size={18} /></button>
          </div>
        )}
        <section className="flex items-center gap-2.5 bg-white px-3 py-3.5 md:rounded-md md:border md:border-line">
          <span className="flex size-[52px] items-center justify-center rounded-full bg-ink text-xl font-extrabold text-white">TA</span>
          <span className="flex-1">
            <h1 className="flex items-center gap-1.5 text-[17px] font-bold">
              Tolu Adeyemi <span className="rounded-full bg-[#E5E7EB] px-1.5 py-0.5 text-[10px]">SILVER</span>
            </h1>
            <span className="text-muted">My profile ›</span>
          </span>
          <Link href="/account" aria-label="Settings" className="flex size-11 items-center justify-center"><Settings aria-hidden size={22} strokeWidth={1.6} /></Link>
        </section>
        <section className="mx-2 overflow-hidden rounded-lg bg-white md:mx-0 md:border md:border-line">
          <div className="grid grid-cols-4 py-3 text-center">
            {[["4", "Coupons", "/deals"], ["1,240", "Points", "/deals"], ["₦0", "Wallet", "/account"], ["0", "Gift cards", "/account"]].map(([v, l, h]) => (
              <Link key={l} href={h} className="flex flex-col gap-1">
                <strong className="text-lg">{v}</strong>
                <span className="text-muted">{l}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-[#FFF6F2] px-3 py-2">
            <strong className="text-sale">₦5,000 OFF</strong>
            <span className="flex-1">coupon expiring soon</span>
            <Link href="/cart" className="border border-black/20 bg-white px-2.5 py-1.5">Use</Link>
          </div>
        </section>
        <section className="mx-2 grid grid-cols-4 gap-x-1 gap-y-3 rounded-lg bg-white p-3 text-center md:mx-0 md:border md:border-line">
          {SERVICES.map(({ label, icon: Icon, href, dot }) => (
            <Link key={label} href={href} className="relative flex flex-col items-center gap-1 text-[11px] leading-tight">
              <Icon aria-hidden size={24} strokeWidth={1.5} />
              {label}
              {dot && <span className="absolute -top-0.5 right-4 size-2 rounded-full bg-sale" />}
            </Link>
          ))}
        </section>
      </div>

      <div className="flex flex-col gap-2 md:gap-4">
        <section className="mx-2 flex flex-col gap-3 rounded-lg bg-white p-3 md:mx-0 md:border md:border-line md:p-5">
          <div className="flex justify-between">
            <h2 className="text-[15px] font-bold">My orders</h2>
            <Link href="/account" className="text-muted">View all ›</Link>
          </div>
          <div className="grid grid-cols-5 text-center">
            {ORDER_TABS.map(({ label, icon: Icon, n }) => (
              <Link key={label} href="/account" className="relative flex flex-col items-center gap-1 text-[11px]">
                <Icon aria-hidden size={26} strokeWidth={1.4} />
                {label}
                {n > 0 && <span className="absolute -top-1 right-[calc(50%-20px)] flex size-4 items-center justify-center rounded-full bg-sale text-[10px] font-extrabold text-white">{n}</span>}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-md bg-[#f7f7f7] p-2.5">
            <div className="flex justify-between">
              <strong>Order FC-20481 · 3 items</strong>
              <span className="font-bold text-success">Arrives ~{now ? addDaysLabel(now, 6) : "soon"}</span>
            </div>
            <ol className="flex items-center" aria-label="Delivery progress">
              {STEPS.map((s, i) => (
                <li key={s} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                  <span
                    aria-label={`${s}${i < current ? " done" : i === current ? " current" : ""}`}
                    className={cn("size-3 shrink-0 rounded-full", i < current ? "bg-success" : i === current ? "border-[3px] border-success bg-white" : "bg-[#d4d4d4]")}
                  />
                  {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1", i < current ? "bg-success" : "bg-[#d4d4d4]")} />}
                </li>
              ))}
            </ol>
            <span className="flex justify-between text-[10px] text-muted">{STEPS.map((s) => <span key={s}>{s}</span>)}</span>
            <span><strong>In the air</strong> · flight left Guangzhou today. QC photos ready to view.</span>
          </div>
        </section>

        <section className="mx-2 flex flex-col gap-2.5 rounded-lg bg-white p-3 md:mx-0 md:border md:border-line md:p-5">
          <span className="flex items-center">
            <h2 className="text-[15px] font-bold">My payment plans</h2>
            <InfoButton topic="pay" />
          </span>
          <div className="flex flex-col gap-1.5 border-b border-[#f0f0f0] pb-2.5">
            <span className="flex justify-between"><span><strong>Pay small small</strong> · Lace front wig 22&quot;</span><span className="text-muted">2 of 4</span></span>
            <Progress value={50} barClass="bg-ink" label="Plan progress" />
            <span className="flex items-center justify-between">
              <span className="text-muted">Next: ₦21,100 due {now ? addDaysLabel(now, 6) : "next week"}</span>
              <button type="button" className="min-h-9 bg-ink px-3.5 font-extrabold text-white">PAY NOW</button>
            </span>
          </div>
          <Link href="/c/TOLU-7K2X" className="flex flex-col gap-1.5">
            <span className="flex justify-between"><span><strong>Group pay</strong> · Order FC-20502</span><span className="font-bold text-group">● Live</span></span>
            <Progress value={36} className="bg-[#E6E4F5]" barClass="bg-group" label="Group pay progress" />
            <span className="text-muted">4 people have chipped in · link closes in 6 days ›</span>
          </Link>
        </section>

        <section className="mx-2 grid grid-cols-3 rounded-lg bg-white md:mx-0 md:border md:border-line">
          <Link href="/account" className="border-r border-[#f0f0f0] px-3 py-2.5"><strong className="block">Wishlist</strong><span className="text-muted">6 items</span></Link>
          <Link href="/account" className="border-r border-[#f0f0f0] px-3 py-2.5"><strong className="block">History</strong><span className="text-sale">2 now cheaper!</span></Link>
          <Link href="/account" className="px-3 py-2.5"><strong className="block">Following</strong><span className="text-muted">3 stores</span></Link>
        </section>

        <section className="mx-2 flex flex-col gap-2 md:mx-0">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            Your interested items are now cheaper
            <span className="text-xs font-normal text-muted">· Midnight Drop in <Countdown target="midnight" /></span>
          </h2>
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            {cheaper.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
        <Link href="/account" className="mx-2 flex items-center gap-2 text-muted md:mx-0"><ScrollText aria-hidden size={16} /> Policies, privacy and draw rules</Link>
      </div>
    </div>
  );
}
