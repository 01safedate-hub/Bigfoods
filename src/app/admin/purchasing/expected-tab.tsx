"use client";

import { useState, useTransition } from "react";
import type { PurchaseView } from "@/lib/data/stock";
import { cn, naira } from "@/lib/format";
import { call } from "@/lib/net";
import { EXPENSE_LABEL } from "../money";
import { markArrived } from "../stock-actions";
import { field, ghost, primary } from "./buy-tab";

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export function ExpectedTab({ purchases }: { purchases: PurchaseView[] }) {
  const open = purchases.filter((p) => p.status === "expected");
  const done = purchases.filter((p) => p.status === "arrived");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#5B6170]">Goods you’ve paid for that haven’t reached the warehouse. When they arrive, press <strong className="text-ink">Mark arrived</strong>. Orders with everything here move to “Ready to send”.</p>
      {open.length === 0 && <p className="rounded-lg border border-[#E3E5EA] bg-white p-4 text-[#5B6170]">Nothing expected right now.</p>}
      {open.map((p) => <PurchaseCard key={p.id} p={p} />)}
      {done.length > 0 && (
        <details className="rounded-lg border border-[#E3E5EA] bg-white">
          <summary className="cursor-pointer p-3.5 font-semibold">Arrived &amp; returned stock ({done.length} recent)</summary>
          <div className="flex flex-col gap-2 border-t border-[#EEF0F3] p-2.5">{done.map((p) => <PurchaseCard key={p.id} p={p} />)}</div>
        </details>
      )}
    </div>
  );
}

function PurchaseCard({ p }: { p: PurchaseView }) {
  const [arriving, setArriving] = useState(false);
  const [got, setGot] = useState<Record<string, number>>(() => Object.fromEntries(p.lines.map((l) => [l.id, l.qty])));
  const [on, setOn] = useState(today);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, start] = useTransition();
  const goods = p.lines.reduce((n, l) => n + l.qty * l.unit_ngn, 0);
  const fees = p.fees.reduce((n, f) => n + f.amount_ngn, 0);
  const confirm = () => start(async () => {
    const short = Object.fromEntries(p.lines.filter((l) => got[l.id] !== l.qty).map((l) => [l.id, got[l.id]]));
    const r = await call(() => markArrived(p.id, short, on));
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setArriving(false);
  });

  return (
    <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#EEF0F3] p-3.5">
        <strong className="font-mono">{p.ref}</strong>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", p.status === "expected" ? "bg-[#FFF7E6] text-[#8A5300]" : "bg-success-soft text-success")}>
          {p.kind === "restock" ? "Returned stock" : p.status === "expected" ? "Expected" : `Arrived ${p.arrived_on ? day(p.arrived_on) : ""}`}
        </span>
        <span className="text-[#5B6170]">{day(p.bought_on)} · {p.supplier ?? "—"} · {p.ship_mode}</span>
        <span className="ml-auto tabular-nums">{naira(goods)}{fees > 0 && <span className="text-[#5B6170]"> + {naira(fees)} fees</span>}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left">
          <thead><tr className="text-xs text-[#5B6170]">{["Product", "Bought", arriving ? "Actually received" : "Received", "Landed / unit", "Goes to"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {p.lines.map((l) => (
              <tr key={l.id} className="border-t border-[#F1F2F4] tabular-nums">
                <td className="px-3 py-2"><strong className="block font-semibold">{l.title}</strong><span className="text-xs text-[#5B6170]">{l.variant || "—"}</span></td>
                <td className="px-3 py-2">{l.qty}</td>
                <td className="px-3 py-2">
                  {arriving
                    ? <input aria-label={`Received of ${l.title}`} inputMode="numeric" value={got[l.id] ?? 0} onChange={(e) => setGot({ ...got, [l.id]: Math.max(0, Math.floor(Number(e.target.value)) || 0) })} className={cn(field, "w-20", got[l.id] !== l.qty && "border-sale")} />
                    : l.received ?? "—"}
                </td>
                <td className="px-3 py-2">{naira(l.landed_ngn)}</td>
                <td className="px-3 py-2">{l.assigned} {l.assigned === 1 ? "unit" : "units"} → {l.customers} {l.customers === 1 ? "order" : "orders"}{(l.received ?? l.qty) - l.assigned > 0 && <span className="text-success"> · {(l.received ?? l.qty) - l.assigned} spare</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {p.fees.length > 0 && <p className="border-t border-[#F1F2F4] px-3.5 py-2 text-xs text-[#5B6170]">Fees: {p.fees.map((f) => `${EXPENSE_LABEL[f.category] ?? f.category} ${naira(f.amount_ngn)}${f.note ? ` (${f.note})` : ""}`).join(" · ")}</p>}
      {p.note && <p className="border-t border-[#F1F2F4] px-3.5 py-2 text-xs text-[#5B6170]">{p.note}</p>}
      {p.status === "expected" && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#EEF0F3] p-3.5">
          {msg && <span role="status" className={cn("mr-auto", msg.ok ? "font-semibold text-success" : "text-sale")}>{msg.text}</span>}
          {arriving ? (
            <>
              <span className="mr-auto text-xs text-[#5B6170]">Change a number only if fewer (or more) came than you bought.</span>
              <label className="flex items-center gap-2 text-xs text-[#5B6170]">Arrived on <input type="date" value={on} onChange={(e) => setOn(e.target.value)} className={field} /></label>
              <button type="button" onClick={() => setArriving(false)} className={ghost}>Back</button>
              <button type="button" disabled={saving} onClick={confirm} className={primary}>{saving ? "Saving…" : "Confirm arrived"}</button>
            </>
          ) : (
            <button type="button" onClick={() => setArriving(true)} className={primary}>Mark arrived</button>
          )}
        </div>
      )}
    </section>
  );
}
