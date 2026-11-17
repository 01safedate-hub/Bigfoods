"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/format";
import { NAIRA_PER_CNY } from "@/lib/pricing/config";

type Tab = "To buy" | "In transit" | "Sort & dispatch by state" | "Shipped";
const TABS: Tab[] = ["To buy", "In transit", "Sort & dispatch by state", "Shipped"];
const DAY = 86_400_000;

/** Sample purchase list (built nightly from paid orders by the `build-purchase-list` edge function). */
const ROWS = [
  { id: "r1", name: "Android phone 6.7\" 5G", variant: "Black / 256GB", orders: 12, supplier: "Shenzhen Haoyu Tech", cny: 620, need: 14, ship: "Air" },
  { id: "r2", name: "Android phone 6.7\" 5G", variant: "Blue / 128GB", orders: 6, supplier: "Shenzhen Haoyu Tech", cny: 540, need: 6, ship: "Air" },
  { id: "r3", name: "Body wave lace wig 22\"", variant: "Natural black", orders: 21, supplier: "Xuchang Meisi Hair", cny: 145, need: 23, ship: "Air" },
  { id: "r4", name: "Satin cowl-neck midi dress", variant: "Wine / M", orders: 39, supplier: "Guangzhou Yiyan Fashion", cny: 28, need: 41, ship: "Air" },
  { id: "r5", name: "Satin cowl-neck midi dress", variant: "Black / S", orders: 35, supplier: "Guangzhou Yiyan Fashion", cny: 28, need: 37, ship: "Air" },
  { id: "r6", name: "Men’s steel quartz watch", variant: "Green dial", orders: 88, supplier: "Yiwu Shijie Watch", cny: 18, need: 96, ship: "Air" },
  { id: "r7", name: "Wireless earbuds ENC", variant: "White", orders: 58, supplier: "Shenzhen Boma Audio", cny: 22, need: 64, ship: "Air" },
  { id: "r8", name: "Ergonomic office chair", variant: "Black mesh", orders: 8, supplier: "Foshan Linyi Furniture", cny: 260, need: 8, ship: "Sea" },
];

const STATES = [
  { name: "Lagos", orders: 142, units: 388, ready: 100, stations: 31 },
  { name: "FCT Abuja", orders: 61, units: 170, ready: 92, stations: 14 },
  { name: "Rivers", orders: 38, units: 96, ready: 100, stations: 9 },
  { name: "Oyo", orders: 27, units: 71, ready: 80, stations: 8 },
  { name: "Enugu", orders: 22, units: 58, ready: 100, stations: 6 },
  { name: "Kano", orders: 19, units: 44, ready: 67, stations: 7 },
];

const SHIPMENTS = [
  { ref: "AWB 784-2219 0431", mode: "Air", content: "Phones, wigs, dresses · 412 units · 186 kg", pct: 70, status: "Departed Guangzhou", days: 3 },
  { ref: "AWB 784-2219 0587", mode: "Air", content: "Watches, earbuds · 230 units · 58 kg", pct: 35, status: "At consolidation warehouse", days: 6 },
  { ref: "Container MSKU 731882-0", mode: "Sea", content: "Chairs, tables, machines · 14 CBM", pct: 40, status: "At sea", days: 52 },
];

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
const shipBadge = (mode: string) => cn("rounded px-1.5 py-0.5 text-[11px] font-bold", mode === "Sea" ? "bg-[#E8EEF9] text-sea" : "bg-[#ECFDF3] text-success");

export function PurchasingView() {
  const now = useNow(60_000) ?? 0;
  const [tab, setTab] = useState<Tab>("To buy");
  const [bought, setBought] = useState<Record<string, number>>({ r1: 14, r2: 6, r3: 10, r4: 41, r5: 0, r6: 96, r7: 30, r8: 0 });
  const [shipped, setShipped] = useState<Record<string, number>>({});

  const need = ROWS.reduce((n, r) => n + r.need, 0);
  const got = ROWS.reduce((n, r) => n + Math.min(r.need, bought[r.id] ?? 0), 0);
  const spend = ROWS.reduce((n, r) => n + (bought[r.id] ?? 0) * r.cny, 0);
  // Demo: Rivers went out 4 days ago.
  const shippedAt = { Rivers: now - 4 * DAY, ...shipped };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Purchasing &amp; dispatch</h1>
          <p className="text-[#5B6170]">Buy in China → receive in Lagos → sort by state → ship to Jumia stations</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-[#E3E5EA] bg-white px-2.5 py-2">Rate: <strong>₦{NAIRA_PER_CNY} / ¥1</strong></span>
          <span className="rounded-md bg-[#ECFDF3] px-2.5 py-2 text-success">● 1688 prices synced 12 min ago</span>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Orders awaiting purchase", "214", "incl. funded group-pay items"], ["Units to buy", need.toLocaleString(), `${got} bought so far`],
          ["Spend today", `¥${spend.toLocaleString()}`, `≈ ₦${(spend * NAIRA_PER_CNY).toLocaleString()}`], ["In transit", "3", "2 air · 1 sea"],
          ["Arrived, sorting", "827", "units across 6 states"], ["Auto-delivered this week", "302", "closed by the 10-day rule"],
        ].map(([l, v, s]) => (
          <div key={l} className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
            <span className="text-xs text-[#5B6170]">{l}</span>
            <strong className="text-[22px]">{v}</strong>
            <span className="text-[11px] text-[#5B6170]">{s}</span>
          </div>
        ))}
      </section>

      <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[#E3E5EA]">
        {TABS.map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("min-h-11 whitespace-nowrap border-b-2 px-3.5 text-sm", tab === t ? "border-ink font-bold" : "border-transparent text-[#5B6170]")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "To buy" && (
        <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF0F3] p-3.5">
            <span className="text-[#5B6170]">Built at 6:00 from paid orders, completed Pay-small-small plans and fully funded Group-pay items. The same item across orders is combined.</span>
            <span className="flex gap-2">
              <button type="button" className="min-h-[38px] rounded-md border border-[#D0D4DB] bg-white px-3 font-semibold">Export for agent</button>
              <button type="button" onClick={() => setBought(Object.fromEntries(ROWS.map((r) => [r.id, r.need])))} className="min-h-[38px] rounded-md bg-ink px-3 font-bold text-white">Mark all as bought</button>
            </span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="text-left text-xs text-[#5B6170]">
                  {["Product", "1688 supplier", "Ship", "Unit ¥", "Needed", "Bought", "Spend ¥", "Status"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => {
                  const b = bought[r.id] ?? 0;
                  const done = b >= r.need;
                  const part = b > 0 && !done;
                  return (
                    <tr key={r.id} className="border-t border-[#EEF0F3]">
                      <td className="px-3 py-2.5"><strong className="block font-semibold">{r.name}</strong><span className="text-xs text-[#5B6170]">{r.variant} · {r.orders} orders</span></td>
                      <td className="px-3 py-2.5"><span className="text-[#2563EB] underline">{r.supplier}</span></td>
                      <td className="px-3 py-2.5"><span className={shipBadge(r.ship)}>{r.ship}</span></td>
                      <td className="px-3 py-2.5 tabular-nums">¥{r.cny}</td>
                      <td className="px-3 py-2.5 font-bold tabular-nums">{r.need}</td>
                      <td className="relative px-3 py-2.5">
                        <label className="sr-only" htmlFor={r.id}>Quantity bought of {r.name} {r.variant}</label>
                        <input id={r.id} type="number" min={0} value={b} onChange={(e) => setBought({ ...bought, [r.id]: Math.max(0, Number(e.target.value) || 0) })} className="w-[72px] rounded-md border border-[#D0D4DB] p-2" />
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">¥{(b * r.cny).toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-full px-2 py-1 text-xs font-bold", done ? "bg-[#ECFDF3] text-success" : part ? "bg-[#FFF7E6] text-[#8A5300]" : "bg-[#FDECEC] text-[#B42318]")}>
                          {done ? "Bought" : part ? `Partial · ${r.need - b} left` : "Not bought"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-end gap-4 border-t border-[#EEF0F3] p-3.5 tabular-nums">
            <span>Bought: <strong>{got} / {need}</strong> units</span>
            <span>Spend: <strong>¥{spend.toLocaleString()}</strong> ≈ <strong>₦{(spend * NAIRA_PER_CNY).toLocaleString()}</strong></span>
          </div>
        </section>
      )}

      {tab === "In transit" && (
        <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {SHIPMENTS.map((s) => (
            <div key={s.ref} className="flex flex-col gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
              <div className="flex justify-between"><strong>{s.ref}</strong><span className={shipBadge(s.mode)}>{s.mode}</span></div>
              <span className="text-[#5B6170]">{s.content}</span>
              <Progress value={s.pct} barClass="bg-[#2563EB]" label={`${s.ref} progress`} />
              <span>{s.status} · ETA <strong>{now ? fmtDate(now + s.days * DAY) : "—"}</strong></span>
              <button type="button" className="min-h-9 self-start rounded-md border border-[#D0D4DB] px-3 font-semibold">Mark arrived in Lagos</button>
            </div>
          ))}
        </section>
      )}

      {tab === "Sort & dispatch by state" && (
        <section className="flex flex-col gap-2.5">
          <p className="text-[#5B6170]">Arrived items are sorted into state bins. Dispatch one state at a time. Partly-arrived orders wait unless the customer chose “ship what’s ready”.</p>
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {STATES.map((s) => {
              const at = shippedAt[s.name as keyof typeof shippedAt];
              const full = s.ready >= 100;
              return (
                <div key={s.name} className="flex flex-col gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
                  <div className="flex items-baseline justify-between"><strong className="text-base">{s.name}</strong><span className="text-[#5B6170]">{s.stations} stations</span></div>
                  <span>{s.orders} orders · {s.units} units</span>
                  <Progress value={s.ready} barClass={full ? "bg-[#16A34A]" : "bg-[#F59E0B]"} label={`${s.name} arrived`} />
                  <span className={cn("text-xs font-semibold", at ? "text-[#2563EB]" : full ? "text-success" : "text-[#8A5300]")}>
                    {at ? `Dispatched ${fmtDate(at)} · auto-delivered ${fmtDate(at + 10 * DAY)}` : full ? "All items arrived · ready" : `${s.ready}% arrived · waiting on ${Math.round((s.units * (100 - s.ready)) / 100)} units`}
                  </span>
                  <button
                    type="button"
                    disabled={!!at}
                    onClick={() => setShipped({ ...shipped, [s.name]: Date.now() })}
                    className={cn("min-h-10 rounded-md font-bold", at ? "bg-[#EEF0F3] text-[#5B6170]" : full ? "bg-ink text-white" : "border border-[#D0D4DB] bg-white")}
                  >
                    {at ? "Dispatched ✓" : full ? `Dispatch ${s.name} batch` : "Dispatch ready orders only"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "Shipped" && (
        <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
          <p className="border-b border-[#EEF0F3] p-3.5 text-[#5B6170]">Status changes to <strong className="text-ink">Delivered</strong> automatically 10 days after dispatch (Jumia delivers within 7). Customers get an SMS at dispatch and at delivery.</p>
          {Object.entries(shippedAt).map(([state, at]) => {
            const days = Math.ceil((at + 10 * DAY - now) / DAY);
            const row = STATES.find((s) => s.name === state);
            return (
              <div key={state} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EEF0F3] p-3.5 first:border-0">
                <strong className="flex-[1_1_160px]">{state} batch</strong>
                <span className="flex-[1_1_120px]">{row?.orders ?? 0} orders</span>
                <span className="flex-[1_1_140px]">Shipped {fmtDate(at)}</span>
                <span className={cn("rounded-full px-2 py-1 text-xs font-bold", days <= 0 ? "bg-[#ECFDF3] text-success" : "bg-[#EEF4FF] text-[#1D4ED8]")}>
                  {days <= 0 ? "Delivered" : `Auto-delivered in ${days} days (${fmtDate(at + 10 * DAY)})`}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
