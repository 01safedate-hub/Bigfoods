"use client";

import { BadgeCheck, ChevronRight, Factory, Palette, ReceiptText, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { supplierLine } from "@/lib/catalog/supplier";
import Link from "next/link";
import { useNow } from "@/hooks/use-now";
import { addDaysLabel } from "@/lib/time";
import { useStationId } from "@/lib/station-store";
import { useSiteData } from "./site-data";

const CHIPS = ["Delivered or refunded", "7-day returns if damaged", "Photo check in China", "Price locked at checkout"];

/** Delivery estimate, payment safety and the order guarantee, right under the price. */
type Facts = Pick<Product, "customMoq" | "customTypes" | "dispatchDays" | "supplier">;

/** Delivery is counted from when the supplier's parcel reaches our China warehouse. */
export function SupplierClock({ days, className = "" }: { days?: number; className?: string }) {
  return (
    <span className={`block text-[12px] text-muted ${className}`}>
      Delivery time counts from when the supplier sends your item to our China warehouse{days ? ` (they usually send it within ${days} days)` : ""}.
    </span>
  );
}

/** How much the factory needs to customise, and what it can customise. */
function CustomNote({ facts, wholesale }: { facts?: Facts; wholesale: boolean }) {
  return (
    <>
      {facts?.customTypes && <span className="mt-1 block"><strong>Can customise:</strong> {facts.customTypes}</span>}
      {facts?.customMoq && facts.customMoq > 1 ? (
        <span className="mt-1 block rounded bg-white/70 px-2 py-1 font-semibold text-[#8A5A00]">
          The factory customises from {facts.customMoq.toLocaleString("en-NG")} pieces. Buy at least {facts.customMoq.toLocaleString("en-NG")} to add your logo{wholesale ? "" : " (the wholesale price applies from 10)"}; smaller orders come plain.
        </span>
      ) : null}
    </>
  );
}

/** Verified supplier, on-time rate and years, without naming them. */
function SupplierRow({ facts }: { facts?: Facts }) {
  const line = supplierLine(facts?.supplier);
  if (!line) return null;
  return (
    <div className="flex min-h-12 items-center gap-2.5 px-3 py-2.5 md:px-0">
      <Factory aria-hidden size={18} className="shrink-0 text-success" />
      <span className="flex-1 leading-snug">{line}</span>
    </div>
  );
}

export function ProductTrust({ sea, customisable = false, wholesale = false, facts }: { sea: boolean; customisable?: boolean; wholesale?: boolean; facts?: Facts }) {
  const now = useNow(60_000);
  const id = useStationId();
  const { stations } = useSiteData();
  const station = stations.find((s) => s.id === id);
  const [from, to] = sea ? [90, 120] : [10, 18];
  const eta = now ? `${addDaysLabel(now, from)} – ${addDaysLabel(now, to)}` : `in ${from}–${to} days`;
  const row = "flex min-h-12 items-center gap-2.5 px-3 md:px-0";
  return (
    <section aria-label="Shipping and guarantees" className="flex flex-col divide-y divide-line bg-white text-[13px] md:rounded-lg md:border md:border-line md:px-4">
      <Link href="/why-fastchina#guarantee" className="flex flex-col gap-2 px-3 py-3 md:px-0">
        <span className="flex items-center gap-2.5 font-bold text-success">
          <Truck aria-hidden size={18} /> Free shipping <ChevronRight aria-hidden size={16} className="ml-auto text-subtle" />
        </span>
        <span className="rounded-md bg-surface p-2.5 leading-relaxed">
          <span className="text-success">Free on every order.</span> Delivery: <strong>{eta}</strong>
          <span className="block text-muted">To {station ? station.name : "your Jumia pickup station"} · {sea ? "by sea" : "by air"}, customs cleared</span>
          <SupplierClock days={facts?.dispatchDays} className="mt-1" />
        </span>
      </Link>
      <div className={`${row} py-2.5`}>
        <ReceiptText aria-hidden size={18} className="shrink-0 text-success" />
        <span className="flex-1 leading-snug">
          <strong>No hidden fees or extra charges.</strong>{" "}
          <span className="text-muted">{wholesale ? "Shipping and customs clearing are in the price. Only delivery inside Nigeria is billed separately, by state." : "The price you see covers the item, shipping, customs and delivery to your pickup station."}</span>
        </span>
      </div>
      {customisable && (
        <div className="flex items-start gap-2.5 bg-[#FFF9EC] px-3 py-3 md:-mx-4 md:px-4">
          <Palette aria-hidden size={18} className="mt-0.5 shrink-0 text-[#8A5A00]" />
          <span className="flex-1 leading-snug">
            <strong className="text-[#8A5A00]">Customisable: add your logo or design.</strong>
            <span className="mt-1 block text-muted">
              Order and pay as normal. Then upload your logo or artwork from <strong>My orders</strong>. We check it with the factory and send you the customisation price, billed separately. Pay it from your order page before it ships.
            </span>
            <CustomNote facts={facts} wholesale={wholesale} />
          </span>
        </div>
      )}
      <SupplierRow facts={facts} />
      <Link href="/why-fastchina#security" className={row}>
        <ShieldCheck aria-hidden size={18} className="text-success" />
        <span className="flex-1">Safe payments · Secure privacy</span>
        <ChevronRight aria-hidden size={16} className="text-subtle" />
      </Link>
      <Link href="/why-fastchina#guarantee" className="flex flex-col gap-2 px-3 py-3 md:px-0">
        <span className="flex items-center gap-2.5">
          <BadgeCheck aria-hidden size={18} className="text-success" />
          <span className="flex-1">Order guarantee</span>
          <span className="text-muted">6 guarantees</span>
          <ChevronRight aria-hidden size={16} className="text-subtle" />
        </span>
        <span className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0">
          {CHIPS.map((c) => <span key={c} className="shrink-0 rounded border border-success/40 px-2 py-1 text-[12px] font-semibold text-success">{c}</span>)}
        </span>
      </Link>
    </section>
  );
}

/** Wholesale: the fee promise and how customisation works, without the single-item delivery block. */
export function ProductTrustNote({ customisable = false, facts }: { customisable?: boolean; facts?: Facts }) {
  return (
    <section aria-label="Fees and customisation" className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white text-[13px]">
      <div className="flex items-start gap-2.5 p-3">
        <ReceiptText aria-hidden size={18} className="mt-0.5 shrink-0 text-success" />
        <span className="leading-snug"><strong>No hidden fees or extra charges.</strong> <span className="text-muted">Sea freight and customs clearing are in the price. Only delivery inside Nigeria is billed separately, by state.</span></span>
      </div>
      {customisable && (
        <div className="flex items-start gap-2.5 bg-[#FFF9EC] p-3">
          <Palette aria-hidden size={18} className="mt-0.5 shrink-0 text-[#8A5A00]" />
          <span className="leading-snug">
            <strong className="text-[#8A5A00]">Customisable: put your brand on it.</strong>
            <span className="mt-1 block text-muted">After you pay, upload your logo or artwork from My orders. We check it with the factory and send the customisation price, billed separately. Pay it from your order page before it ships.</span>
            <CustomNote facts={facts} wholesale />
          </span>
        </div>
      )}
      <div className="p-3"><SupplierClock days={facts?.dispatchDays} /></div>
      <SupplierRow facts={facts} />
    </section>
  );
}
