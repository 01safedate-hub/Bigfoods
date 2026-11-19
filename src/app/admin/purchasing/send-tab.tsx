"use client";

import { useState, useTransition } from "react";
import type { QueueOrder, StockFilters } from "@/lib/data/stock";
import { cn, naira } from "@/lib/format";
import { call } from "@/lib/net";
import { dispatchOrders } from "../stock-actions";
import { field, ghost, primary } from "./buy-tab";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const paid = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }) : "not fully paid");
const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/[^\d]/g, ""))) || 0);

export function SendTab({ orders, states, filters }: { orders: QueueOrder[]; states: string[]; filters: StockFilters }) {
  const [pick, setPick] = useState<Record<string, { cost: number; tracking: string }>>({});
  const [carrier, setCarrier] = useState("Jumia");
  const [date, setDate] = useState(today);
  const [extra, setExtra] = useState(0);
  const [same, setSame] = useState(0);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, start] = useTransition();
  const ready = orders.filter((o) => o.ready);
  const chosen = Object.keys(pick);
  const total = chosen.reduce((n, id) => n + pick[id].cost, 0) + extra;
  const toggle = (id: string) => setPick((p) => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = { cost: same, tracking: "" }; return n; });

  const send = () => start(async () => {
    const r = await call(() => dispatchOrders({ carrier, date, extra, note, orders: chosen.map((id) => ({ id, cost: pick[id].cost, tracking: pick[id].tracking })) }));
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) { setPick({}); setExtra(0); setNote(""); }
  });

  return (
    <div className="flex flex-col gap-3">
      <form className="flex flex-wrap items-end gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3" role="search">
        <input type="hidden" name="tab" value="send" />
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">State
          <select name="state" defaultValue={filters.state} className={cn(field, "text-sm text-ink")}><option value="">All states</option>{states.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Paid from<input type="date" name="from" defaultValue={filters.from} className={cn(field, "text-sm text-ink")} /></label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Paid to<input type="date" name="to" defaultValue={filters.to} className={cn(field, "text-sm text-ink")} /></label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Show
          <select name="show" defaultValue={filters.show} className={cn(field, "text-sm text-ink")}>
            <option value="ready">Complete: ready to send</option><option value="waiting">Still waiting for goods</option><option value="all">All open orders</option>
          </select>
        </label>
        <button type="submit" className={primary}>Filter</button>
      </form>

      <p className="text-xs text-[#5B6170]">{orders.length} {orders.length === 1 ? "order" : "orders"}{ready.length !== orders.length ? ` · ${ready.length} complete` : ""}. Oldest payment first.</p>
      {orders.length === 0 && <p className="rounded-lg border border-[#E3E5EA] bg-white p-4 text-[#5B6170]">{filters.show === "ready" ? "No complete orders for this filter yet. Mark goods arrived under “Expected goods”." : "No orders for this filter."}</p>}

      {ready.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button type="button" className={cn(ghost, "min-h-9")} onClick={() => setPick(Object.fromEntries(ready.map((o) => [o.id, pick[o.id] ?? { cost: same, tracking: "" }])))}>Tick all {ready.length} complete</button>
          {chosen.length > 0 && <button type="button" className={cn(ghost, "min-h-9")} onClick={() => setPick({})}>Clear</button>}
          <label className="ml-auto flex items-center gap-2 text-[#5B6170]">Same Jumia price for each
            <input inputMode="numeric" placeholder="₦" value={same || ""} onChange={(e) => { const v = num(e.target.value); setSame(v); setPick((p) => Object.fromEntries(Object.entries(p).map(([k, x]) => [k, { ...x, cost: v }]))); }} className={cn(field, "w-24")} />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {orders.map((o) => {
          const on = !!pick[o.id];
          return (
            <div key={o.id} className={cn("flex flex-col gap-2 rounded-lg border bg-white p-3.5", on ? "border-ink" : "border-[#E3E5EA]")}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {o.ready
                  ? <input type="checkbox" checked={on} onChange={() => toggle(o.id)} aria-label={`Send order ${o.code}`} className="size-5 accent-ink" />
                  : <span className="rounded-full bg-[#FFF7E6] px-2 py-0.5 text-xs font-bold text-[#8A5300]">{o.arrived} of {o.units} here</span>}
                <strong className="font-mono">#{o.code}</strong>
                <span className="font-semibold">{o.name ?? o.phone}</span>
                <span className="text-[#5B6170]">{o.state}{o.station ? ` · ${o.station}` : ""}{o.channel === "wholesale" ? " · wholesale" : ""}</span>
                <span className="ml-auto text-xs text-[#5B6170]">paid {paid(o.paid_at)}</span>
              </div>
              <ul className="flex flex-col gap-0.5 text-[13px]">
                {o.items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span>{i.title} <span className="text-xs text-[#5B6170]">{i.variant} ×{i.qty}</span></span>
                    <span className={cn("text-xs", i.arrived >= i.qty ? "text-success" : i.assigned >= i.qty ? "text-[#2563EB]" : "text-sale")}>
                      {i.arrived >= i.qty ? "here ✓" : i.assigned >= i.qty ? `bought, ${i.qty - i.arrived} on the way` : `${i.qty - i.assigned} not bought`}
                    </span>
                  </li>
                ))}
              </ul>
              {on && (
                <div className="flex flex-wrap gap-2 border-t border-[#EEF0F3] pt-2">
                  <label className="flex items-center gap-2 text-xs text-[#5B6170]">Shipping cost ₦
                    <input inputMode="numeric" value={pick[o.id].cost || ""} onChange={(e) => setPick({ ...pick, [o.id]: { ...pick[o.id], cost: num(e.target.value) } })} className={cn(field, "w-24")} />
                  </label>
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[#5B6170]">Tracking no.
                    <input value={pick[o.id].tracking} onChange={(e) => setPick({ ...pick, [o.id]: { ...pick[o.id], tracking: e.target.value } })} className={cn(field, "min-w-0 flex-1")} />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {chosen.length > 0 && (
        <section className="sticky bottom-2 flex flex-col gap-2 rounded-lg border-2 border-ink bg-white p-3.5 shadow-lg">
          <strong>Send {chosen.length} {chosen.length === 1 ? "order" : "orders"}</strong>
          <div className="grid gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Sent with<input value={carrier} onChange={(e) => setCarrier(e.target.value)} className={cn(field, "text-sm text-ink")} /></label>
            <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Date sent<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "text-sm text-ink")} /></label>
            <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Extra cost ₦ (transport, packing)<input inputMode="numeric" value={extra || ""} onChange={(e) => setExtra(num(e.target.value))} className={cn(field, "text-sm text-ink")} /></label>
            <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Note<input value={note} onChange={(e) => setNote(e.target.value)} className={cn(field, "text-sm text-ink")} /></label>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {msg && <span role="status" className={cn("mr-auto", msg.ok ? "font-semibold text-success" : "text-sale")}>{msg.text}</span>}
            <span className="tabular-nums">Shipping total <strong>{naira(total)}</strong></span>
            <button type="button" disabled={saving} onClick={send} className={primary}>{saving ? "Sending…" : "Mark as sent"}</button>
          </div>
        </section>
      )}
      {chosen.length === 0 && msg && <p role="status" className={msg.ok ? "font-semibold text-success" : "text-sale"}>{msg.text}</p>}
    </div>
  );
}
