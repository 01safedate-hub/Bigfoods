import {
  Bell, Box, ChevronRight, Headphones, MapPin, MessageSquareText, Package, Plane, RotateCcw, ScrollText, Settings, ShieldCheck, Star, Store, Wallet, Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { getProducts } from "@/lib/data/catalog";
import { getMe, ORDER_GROUPS, type OrderGroup } from "@/lib/data/me";
import { getSiteData } from "@/lib/data/site";
import { naira } from "@/lib/format";
import { trackingStep, type OrderStatus } from "@/lib/orders/lifecycle";
import { CheckInButton } from "./check-in-button";

export const metadata: Metadata = { title: "Me", robots: { index: false } };

const ORDER_ICONS: Record<OrderGroup, typeof Wallet> = { unpaid: Wallet, processing: Box, shipped: Plane, review: Star, returns: RotateCcw };

export default function AccountPage() {
  return (
    // Phones: one column. Desktop: the profile on the left (sticky), picks fill the rest.
    <div className="flex w-full flex-col gap-2.5 bg-surface pb-8 md:bg-transparent md:pt-6 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-2.5 lg:sticky lg:top-28">
        <Suspense fallback={<div className="m-3 h-64 animate-pulse rounded-2xl bg-white md:m-0" />}>
          <Profile />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <Picks />
      </Suspense>
    </div>
  );
}

async function Profile() {
  await connection();
  const [me, site] = await Promise.all([getMe(), getSiteData()]);

  if (!me) {
    return (
      <section className="mx-2 flex flex-col gap-4 rounded-2xl bg-white p-5 md:mx-0 md:border md:border-line">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface text-xl font-extrabold text-muted">?</span>
          <span className="flex flex-col">
            <h1 className="text-[18px] font-extrabold">Welcome to FastChina</h1>
            <span className="text-[13px] text-muted">Sign in to see orders, points and your wallet.</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/sign-in?next=/account" className="flex min-h-12 items-center justify-center rounded-full bg-ink text-[15px] font-bold text-white">Create account</Link>
          <Link href="/sign-in?mode=signin&next=/account" className="flex min-h-12 items-center justify-center rounded-full border border-ink text-[15px] font-bold">Sign in</Link>
        </div>
        <Link href="/deals" className="flex items-center justify-between border-t border-line pt-3 text-[14px]">
          <span className="flex items-center gap-2 font-bold text-sale"><Zap aria-hidden size={18} className="fill-sale" /> Deals</span>
          <ChevronRight aria-hidden size={16} className="text-muted" />
        </Link>
        <Link href="/account/settings" className="flex items-center justify-between border-t border-line pt-3 text-[14px]">
          <span className="flex items-center gap-2"><Settings aria-hidden size={18} /> Settings</span>
          <ChevronRight aria-hidden size={16} className="text-muted" />
        </Link>
      </section>
    );
  }

  const initial = me.name.trim()[0]?.toUpperCase() ?? "F";
  const staff = me.role !== "customer" && me.role !== "seller";
  const latest = me.orders.find((o) => !["delivered", "cancelled", "refunded"].includes(o.status));

  return (
    <>
      <section className="flex items-center gap-3 bg-white px-4 py-4 md:rounded-2xl md:border md:border-line">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-xl font-extrabold text-white">{initial}</span>
        <Link href="/account/settings/profile" className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-[18px] font-extrabold">{me.name}</h1>
          <span className="text-[13px] text-muted">My profile ›</span>
        </Link>
        <Link href="/notifications" aria-label="Notifications" className="flex size-11 items-center justify-center"><Bell aria-hidden size={22} strokeWidth={1.6} /></Link>
        <Link href="/account/settings" aria-label="Settings" className="flex size-11 items-center justify-center"><Settings aria-hidden size={22} strokeWidth={1.6} /></Link>
      </section>

      <section className="mx-2 overflow-hidden rounded-2xl bg-white md:mx-0 md:border md:border-line">
        <div className="grid grid-cols-4 py-3.5 text-center">
          {[
            [String(site.coupons.length), "Coupons", "/deals"],
            [me.points.toLocaleString("en-NG"), "Points", "/deals"],
            [naira(me.wallet), "Wallet", "/account/wallet"],
            [String(me.saved), "Saved", "/wishlist"],
          ].map(([v, l, h]) => (
            <Link key={l} href={h} className="flex flex-col gap-0.5">
              <strong className="text-[17px] tabular-nums">{v}</strong>
              <span className="text-[12px] text-muted">{l}</span>
            </Link>
          ))}
        </div>
        <Link href="/account/settings/station" className="flex items-center gap-2 border-t border-line bg-success-soft/60 px-4 py-2.5 text-[13px]">
          <MapPin aria-hidden size={16} className="shrink-0 text-success" />
          <span className="min-w-0 flex-1 truncate">{me.station ? <>Delivering to <strong>{me.station.name}</strong></> : <strong>Choose your pickup station</strong>}</span>
          <span className="font-bold">{me.station ? "Change" : "Set"}</span>
        </Link>
      </section>

      <section className="mx-2 flex flex-col gap-3 rounded-2xl bg-white p-4 md:mx-0 md:border md:border-line">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold">My orders</h2>
          <Link href="/account/orders" className="text-[13px] text-muted">View all ›</Link>
        </div>
        <div className="grid grid-cols-5 text-center">
          {(Object.keys(ORDER_GROUPS) as OrderGroup[]).map((g) => {
            const Icon = ORDER_ICONS[g];
            const n = me.counts[g];
            return (
              <Link key={g} href={`/account/orders?tab=${g}`} className="relative flex flex-col items-center gap-1 text-[12px]">
                <Icon aria-hidden size={26} strokeWidth={1.4} />
                {ORDER_GROUPS[g].label}
                {n > 0 && <span className="absolute -top-1.5 left-[calc(50%+6px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-extrabold text-white">{n}</span>}
              </Link>
            );
          })}
        </div>
        {latest && (
          <Link href={`/track?code=${latest.code}`} className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <Plane aria-hidden size={18} className="shrink-0" />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-[13px]">#{latest.code} · {trackingStep(latest.status as OrderStatus).label}</strong>
              <span className="truncate text-[12px] text-muted">{latest.items.map((i) => i.title).join(", ") || "Your order"}</span>
            </span>
            <strong className="text-[13px]">{naira(latest.total_ngn)}</strong>
          </Link>
        )}
      </section>

      <section className="mx-2 grid grid-cols-4 gap-y-4 rounded-2xl bg-white p-4 text-center md:mx-0 md:border md:border-line">
        {[
          [Zap, "Deals", "/deals"],
          [Headphones, "Customer service", "/account/settings/contact"],
          [MessageSquareText, "Feedback", "/account/settings/feedback"],
          [ShieldCheck, "Why FastChina", "/why-fastchina"],
          [ScrollText, "Policy", "/legal/terms"],
          [Store, "Open a store", "/store"],
          [Package, "Wholesale", "/wholesale"],
          ...(staff ? [[Settings, "Admin", "/admin"] as const] : []),
        ].map(([Icon, label, href]) => {
          const I = Icon as typeof Wallet;
          return (
            <Link key={label as string} href={href as string} className="flex flex-col items-center gap-1.5 text-[12px] leading-tight">
              <I aria-hidden size={24} strokeWidth={1.5} className={label === "Deals" ? "fill-sale text-sale" : undefined} />
              <span className={label === "Deals" ? "font-bold text-sale" : undefined}>{label as string}</span>
            </Link>
          );
        })}
      </section>

      <div className="mx-2 md:mx-0">
        <CheckInButton />
      </div>
    </>
  );
}

async function Picks() {
  const products = (await getProducts()).slice(0, 12);
  if (!products.length) return null;
  return (
    <section aria-labelledby="picks-h" className="flex flex-col gap-2 px-2 pt-2 md:px-0 lg:pt-0">
      <h2 id="picks-h" className="text-[15px] font-extrabold">Picked for you</h2>
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}
