"use client";

import { BadgeCheck, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useNow } from "@/hooks/use-now";
import { addDaysLabel } from "@/lib/time";
import { useStationId } from "@/lib/station-store";
import { useSiteData } from "./site-data";

const CHIPS = ["Delivered or refunded", "7-day returns if damaged", "Photo check in China", "Price locked at checkout"];

/** Delivery estimate, payment safety and the order guarantee, right under the price. */
export function ProductTrust({ sea }: { sea: boolean }) {
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
        </span>
      </Link>
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
