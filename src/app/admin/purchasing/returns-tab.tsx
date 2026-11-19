"use client";

import { useState, useTransition } from "react";
import type { ReturnLookup } from "@/lib/data/stock";
import { cn, naira } from "@/lib/format";
import { call } from "@/lib/net";
import { REASON_LABEL } from "../money";
import { lookupOrder, recordReturn } from "../stock-actions";
import { field, primary } from "./buy-tab";

const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/[^\d]/g, ""))) || 0);

export function ReturnsTab() {
  const [code, setCode] = useState("");
  const [o, setO] = useState<ReturnLookup | null>(null);
  const [item, setItem] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("not_collected");
  const [refund, setRefund] = useState(0);
  const [fee, setFee] = useState(0);
  const [restock, setRestock] = useState(true);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();

  const find = () => start(async () => {
    setMsg(null);
    const r = await lookupOrder(code).catch(() => ({ error: "Couldn’t reach the server." }));
    if ("error" in r) { setO(null); setMsg({ ok: false, text: r.error }); return; }
    setO(r); setItem(""); setQty(1);
    setRefund(Math.max(0, r.paid - r.refunded));
  });
  const it = o?.items.find((i) => i.id === item);
  const sent = o && ["shipped", "delivered", "refunded"].includes(o.status);
  const save = () => start(async () => {
    if (!o) return;
    const r = await call(() => recordReturn({ order: o.id, item: item || null, qty: it ? qty : null, reason, refund, fee, restock, note }));
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) { setO(null); setCode(""); setNote(""); setFee(0); }
  });

  return (
    <section className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-white p-3.5">
      <div>
        <strong className="text-base">Record a customer who didn’t pick up (or sent goods back)</strong>
        <p className="text-xs text-[#5B6170]">Enter the order code. Choose the whole order or one product, the refund, and any fee Jumia charged. Goods put back in stock go to the next waiting customer.</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); find(); }}>
        <label htmlFor="ret-code" className="sr-only">Order code</label>
        <input id="ret-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Order code e.g. 737012B0" className={cn(field, "min-w-0 flex-1 font-mono uppercase")} />
        <button type="submit" disabled={busy || code.trim().length < 8} className={primary}>Find</button>
      </form>

      {o && (
        <div className="flex flex-col gap-3">
          <p className="rounded-md bg-[#F4F5F7] p-3">
            <strong className="font-mono">#{o.code}</strong> · {o.name ?? o.phone} · {o.status.replace("_", " ")} · paid <strong>{naira(o.paid)}</strong>
            {o.refunded > 0 && <> · already refunded {naira(o.refunded)}</>}
          </p>
          {!sent && <p className="text-sale">This order hasn’t been sent yet. To stop it, cancel it from Orders instead.</p>}
          {sent && (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs text-[#5B6170]">What came back
                  <select value={item} onChange={(e) => { setItem(e.target.value); const x = o.items.find((i) => i.id === e.target.value); setQty(x?.qty ?? 1); setRefund(x ? Math.min(x.qty * x.unit_ngn, o.paid - o.refunded) : o.paid - o.refunded); }} className={cn(field, "text-sm text-ink")}>
                    <option value="">The whole order</option>
                    {o.items.map((i) => <option key={i.id} value={i.id}>{i.title} {i.variant} ×{i.qty}</option>)}
                  </select>
                </label>
                {it && <label className="flex flex-col gap-1 text-xs text-[#5B6170]">How many<input inputMode="numeric" value={qty} onChange={(e) => { const q = Math.min(it.qty, Math.max(1, num(e.target.value))); setQty(q); setRefund(Math.min(q * it.unit_ngn, o.paid - o.refunded)); }} className={cn(field, "text-sm text-ink")} /></label>}
                <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Reason
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className={cn(field, "text-sm text-ink")}>{Object.entries(REASON_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Refund to customer ₦<input inputMode="numeric" value={refund || ""} onChange={(e) => setRefund(num(e.target.value))} className={cn(field, "text-sm text-ink")} /></label>
                <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Return fee we paid ₦<input inputMode="numeric" value={fee || ""} onChange={(e) => setFee(num(e.target.value))} placeholder="0" className={cn(field, "text-sm text-ink")} /></label>
                <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Note<input value={note} onChange={(e) => setNote(e.target.value)} className={cn(field, "text-sm text-ink")} /></label>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="size-5 accent-ink" /> Goods are back with us and can be sold again (put back in stock)</label>
              <p className="text-xs text-[#5B6170]">Customers with an account get the refund in their FastChina wallet; guest orders go to the refunds list for a bank transfer.{!item && " The whole order will show as refunded."}</p>
              <div className="flex justify-end"><button type="button" disabled={busy} onClick={save} className={primary}>{busy ? "Saving…" : "Record"}</button></div>
            </>
          )}
        </div>
      )}
      {msg && <p role="status" className={msg.ok ? "font-semibold text-success" : "text-sale"}>{msg.text}</p>}
    </section>
  );
}
