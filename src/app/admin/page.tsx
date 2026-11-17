import { AlertTriangle, MessageSquare, RotateCcw, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { type Dashboard, getDashboard } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Dashboard" };

const SAMPLE: Dashboard = {
  sales_today: 1_284_600, orders_today: 37, sales_7d: 8_912_300, profit_7d: 2_406_100,
  daily: Array.from({ length: 14 }, (_, i) => ({ d: `2026-11-${String(4 + i).padStart(2, "0")}`, sales: [820, 910, 760, 1040, 1180, 990, 870, 1120, 1340, 1210, 1460, 1390, 1530, 1285][i] * 1000 })),
  by_status: { awaiting_payment: 12, part_paid: 31, paid: 18, purchasing: 9, purchased: 22, shipped: 64, delivered: 412, cancelled: 7 },
  plans_at_risk: 4, questions_pending: 12, refunds_pending: 46_300,
  guard: { run_at: "2026-11-17T03:20:00Z", checked: 78, safe: 71, watch: 7, paused: 0, blocked: 0 },
  guarded: [],
};

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Waiting for payment", part_paid: "Part paid", paid: "Paid", purchasing: "Buying", purchased: "Bought",
  at_warehouse: "At warehouse", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};

export default async function AdminHome() {
  const s = await checkStaff();
  const d = (s.ok && !s.demo ? await getDashboard() : null) ?? SAMPLE;
  const max = Math.max(1, ...d.daily.map((x) => x.sales));
  const margin = d.sales_7d ? Math.round((d.profit_7d / d.sales_7d) * 100) : 0;
  return (
    <>
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          ["Sales today", naira(d.sales_today), `${d.orders_today} paid orders`],
          ["Sales, 7 days", naira(d.sales_7d), "paid orders, Lagos days"],
          ["Profit, 7 days", naira(d.profit_7d), `${margin}% of sales, after coupons`],
          ["Shipped, awaiting delivery", String(d.by_status.shipped ?? 0), "auto-delivered after 10 days"],
        ].map(([k, v, sub]) => (
          <div key={k} className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
            <span className="text-xs text-[#5B6170]">{k}</span>
            <strong className="text-xl tabular-nums">{v}</strong>
            <span className="text-xs text-[#5B6170]">{sub}</span>
          </div>
        ))}
      </section>

      <section className="grid gap-2.5 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
          <strong>Sales, last 14 days</strong>
          <div className="flex h-40 gap-1.5" role="img" aria-label={`Daily sales, highest ${naira(max)}`}>
            {d.daily.map((x) => (
              <div key={x.d} className="group flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <span className="w-full rounded-t bg-ink/85 group-last:bg-sale" style={{ height: `${Math.max(2, (x.sales / max) * 100)}%` }} title={`${x.d}: ${naira(x.sales)}`} />
                </div>
                <span className="text-[9px] text-[#5B6170]">{Number(x.d.slice(8))}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
          <strong>Needs attention</strong>
          <Link href="/admin/questions" className="flex items-center gap-2 rounded-md bg-[#F4F5F7] p-2.5"><MessageSquare aria-hidden size={16} /> <span className="flex-1">Questions waiting</span><strong>{d.questions_pending}</strong></Link>
          <Link href="/admin/orders?status=part_paid" className="flex items-center gap-2 rounded-md bg-[#F4F5F7] p-2.5"><AlertTriangle aria-hidden size={16} className="text-[#B45309]" /> <span className="flex-1">Pay small small plans overdue</span><strong>{d.plans_at_risk}</strong></Link>
          <div className="flex items-center gap-2 rounded-md bg-[#F4F5F7] p-2.5"><RotateCcw aria-hidden size={16} /> <span className="flex-1">Guest refunds to pay out</span><strong>{naira(d.refunds_pending)}</strong></div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-[#F4F5F7] p-2.5">
            <ShieldCheck aria-hidden size={16} className="text-success" />
            <span className="flex-1">Profit guard{d.guard ? ` · ${d.guard.checked} variants` : ""}</span>
            <strong className="w-full pl-6 text-xs">{d.guard ? `${d.guard.safe} safe · ${d.guard.watch} watch · ${d.guard.paused} paused · ${d.guard.blocked} stopped` : "not run yet"}</strong>
          </div>
        </div>
      </section>

      <section className="grid gap-2.5 lg:grid-cols-2">
        <div className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
          <strong className="p-3.5 pb-2">Orders by status</strong>
          {Object.entries(STATUS_LABEL).filter(([k]) => d.by_status[k]).map(([k, label]) => (
            <Link key={k} href={`/admin/orders?status=${k}`} className="flex justify-between border-t border-[#EEF0F3] px-3.5 py-2.5"><span>{label}</span><strong className="tabular-nums">{d.by_status[k]}</strong></Link>
          ))}
        </div>
        <div className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
          <strong className="p-3.5 pb-2">Variants the profit guard is watching</strong>
          {d.guarded.length === 0 && <p className="border-t border-[#EEF0F3] p-3.5 text-[#5B6170]">Nothing is paused or stopped. Every variant makes money under every promotion.</p>}
          {d.guarded.slice(0, 12).map((g, i) => (
            <div key={i} className="flex items-center justify-between gap-2 border-t border-[#EEF0F3] px-3.5 py-2.5">
              <span className="min-w-0 truncate">{g.title}<span className="text-xs text-[#5B6170]"> · {g.variant ?? "one size"}</span></span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${g.verdict === "block" ? "bg-[#FDECEC] text-[#B42318]" : g.verdict === "pause" ? "bg-[#FFF7E6] text-[#8A5300]" : "bg-[#EEF4FF] text-[#1D4ED8]"}`}>
                {g.verdict === "block" ? "Stopped" : g.verdict === "pause" ? "Full price only" : "Watch"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
