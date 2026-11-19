"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { BuyRow, SkuOption } from "@/lib/data/stock";
import { cn, naira } from "@/lib/format";
import { call } from "@/lib/net";
import { NAIRA_PER_CNY } from "@/lib/pricing/config";
import { EXPENSE_LABEL, FEE_CATS } from "../money";
import { findSkus, recordPurchase } from "../stock-actions";

export const field = "min-h-10 rounded-md border border-[#D0D4DB] bg-white px-2.5";
export const primary = "min-h-10 rounded-md bg-ink px-4 font-bold text-white disabled:opacity-50";
export const ghost = "min-h-10 rounded-md border border-[#D0D4DB] bg-white px-3 font-semibold";

type Line = { sku_id: string; title: string; variant: string; qty: number; unit: number };
type Fee = { category: string; amount: number; note: string };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/[^\d.]/g, ""))) || 0);

export function BuyTab({ rows }: { rows: BuyRow[] }) {
  const [lines, setLines] = useState<Line[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  const add = (l: Line) => {
    setLines((ls) => (ls.some((x) => x.sku_id === l.sku_id) ? ls : [...ls, l]));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF0F3] p-3.5">
          <span className="text-[#5B6170]">What paid customers are waiting for that hasn’t been bought yet. Oldest payment gets goods first.</span>
          {rows.length > 0 && (
            <button type="button" className={ghost} onClick={() => setLines(rows.map((r) => ({ sku_id: r.sku_id, title: r.title, variant: r.variant, qty: r.short, unit: r.est || Math.round(r.cny * NAIRA_PER_CNY) })))}>
              Buy everything on this list
            </button>
          )}
        </div>
        {rows.length === 0 && <p className="p-3.5 text-[#5B6170]">Nothing to buy: every paid order has goods bought for it. You can still record a purchase for stock below.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            {rows.length > 0 && <thead><tr className="text-xs text-[#5B6170]">{["Product", "Supplier", "Orders", "Ordered", "Bought", "Still to buy", ""].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>}
            <tbody>
              {rows.map((r) => (
                <tr key={r.sku_id} className="border-t border-[#EEF0F3] tabular-nums">
                  <td className="px-3 py-2.5"><strong className="block font-semibold">{r.title}</strong><span className="text-xs text-[#5B6170]">{r.variant || "—"}{r.sea && " · sea"}{r.cny ? ` · ¥${r.cny}` : ""}</span></td>
                  <td className="px-3 py-2.5 text-[#5B6170]">{r.supplier ?? "—"}</td>
                  <td className="px-3 py-2.5">{r.orders}</td>
                  <td className="px-3 py-2.5">{r.need}</td>
                  <td className="px-3 py-2.5">{r.covered}</td>
                  <td className="px-3 py-2.5 font-bold text-sale">{r.short}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button type="button" onClick={() => add({ sku_id: r.sku_id, title: r.title, variant: r.variant, qty: r.short, unit: r.est || Math.round(r.cny * NAIRA_PER_CNY) })} className={cn(ghost, "min-h-9 text-xs")}>
                      {lines.some((l) => l.sku_id === r.sku_id) ? "Added ✓" : "Add to purchase"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div ref={formRef}><PurchaseForm lines={lines} setLines={setLines} add={add} /></div>
    </>
  );
}

function PurchaseForm({ lines, setLines, add }: { lines: Line[]; setLines: (f: (l: Line[]) => Line[]) => void; add: (l: Line) => void }) {
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<SkuOption[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [supplier, setSupplier] = useState("");
  const [ship, setShip] = useState("air");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, start] = useTransition();

  useEffect(() => {
    if (term.trim().length < 2) return;
    const t = setTimeout(async () => setFound(await findSkus(term).catch(() => [])), 250);
    return () => clearTimeout(t);
  }, [term]);

  const goods = lines.reduce((n, l) => n + l.qty * l.unit, 0);
  const extra = fees.reduce((n, f) => n + f.amount, 0);
  const units = lines.reduce((n, l) => n + l.qty, 0);
  const set = (i: number, p: Partial<Line>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const landed = (l: Line) => l.unit + (extra && goods ? Math.round((extra * l.unit) / goods) : extra && units ? Math.round(extra / units) : 0);

  const save = () => start(async () => {
    const r = await call(() => recordPurchase({ supplier, ship, date, note, lines: lines.map((l) => ({ sku_id: l.sku_id, qty: l.qty, unit_ngn: l.unit })), fees: fees.map((f) => ({ category: f.category, amount_ngn: f.amount, note: f.note })) }));
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) { setLines(() => []); setFees([]); setNote(""); }
  });

  return (
    <section className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-white p-3.5">
      <div>
        <strong className="text-base">Record a purchase</strong>
        <p className="text-xs text-[#5B6170]">Pick the products and how many you bought, then any extra fees. Goods show as expected and go to customers automatically.</p>
      </div>

      <div className="relative">
        <label htmlFor="sku-search" className="sr-only">Find a product</label>
        <Search aria-hidden size={16} className="absolute left-3 top-3 text-[#5B6170]" />
        <input id="sku-search" value={term} onChange={(e) => { setTerm(e.target.value); if (e.target.value.trim().length < 2) setFound([]); }} placeholder="Find a product to add (type its name)" className={cn(field, "w-full pl-9")} autoComplete="off" />
        {found.length > 0 && term.trim().length >= 2 && (
          <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-[#D0D4DB] bg-white shadow-lg">
            {found.map((o) => (
              <li key={o.id}>
                <button type="button" className="flex w-full justify-between gap-3 px-3 py-2 text-left hover:bg-[#F4F5F7]"
                  onClick={() => { add({ sku_id: o.id, title: o.title, variant: o.variant, qty: 1, unit: o.est || Math.round(o.cny * NAIRA_PER_CNY) }); setTerm(""); setFound([]); }}>
                  <span>{o.title} <span className="text-xs text-[#5B6170]">{o.variant}</span></span>
                  <span className="text-xs text-[#5B6170]">{o.cny ? `¥${o.cny}` : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-md bg-[#F4F5F7] p-3 text-[#5B6170]">No products yet. Use “Add to purchase” above or search.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead><tr className="text-xs text-[#5B6170]">{["Product", "Qty bought", "Price per unit (₦)", "Landed / unit", "Line total", ""].map((h) => <th key={h} className="px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.sku_id} className="border-t border-[#EEF0F3] tabular-nums">
                  <td className="px-2 py-2"><strong className="block font-semibold">{l.title}</strong><span className="text-xs text-[#5B6170]">{l.variant || "—"}</span></td>
                  <td className="px-2 py-2"><input aria-label={`Quantity of ${l.title}`} inputMode="numeric" value={l.qty || ""} onChange={(e) => set(i, { qty: num(e.target.value) })} className={cn(field, "w-20")} /></td>
                  <td className="px-2 py-2">
                    <input aria-label={`Price per unit of ${l.title} in naira`} inputMode="numeric" value={l.unit || ""} onChange={(e) => set(i, { unit: num(e.target.value) })} className={cn(field, "w-28")} />
                    <button type="button" className="ml-1 text-xs text-[#2563EB] underline" onClick={() => { const y = prompt("Price in yuan (¥)?"); if (y) set(i, { unit: Math.round(num(y) * NAIRA_PER_CNY) }); }}>from ¥</button>
                  </td>
                  <td className="px-2 py-2 text-[#5B6170]">{naira(landed(l))}</td>
                  <td className="px-2 py-2 font-semibold">{naira(l.qty * l.unit)}</td>
                  <td className="px-2 py-2 text-right"><button type="button" aria-label={`Remove ${l.title}`} onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} className="p-2 text-[#5B6170]"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <strong className="text-sm">Extra fees on this purchase <span className="font-normal text-[#5B6170]">(freight, customs, agent…). They are spread over the goods so profit is real.</span></strong>
        {fees.map((f, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <select aria-label="Fee type" value={f.category} onChange={(e) => setFees(fees.map((x, k) => (k === i ? { ...x, category: e.target.value } : x)))} className={field}>
              {FEE_CATS.map((c) => <option key={c} value={c}>{EXPENSE_LABEL[c]}</option>)}
            </select>
            <input aria-label="Fee amount in naira" inputMode="numeric" placeholder="₦ amount" value={f.amount || ""} onChange={(e) => setFees(fees.map((x, k) => (k === i ? { ...x, amount: num(e.target.value) } : x)))} className={cn(field, "w-32")} />
            <input aria-label="Fee note" placeholder="Note (optional)" value={f.note} onChange={(e) => setFees(fees.map((x, k) => (k === i ? { ...x, note: e.target.value } : x)))} className={cn(field, "min-w-0 flex-1")} />
            <button type="button" aria-label="Remove fee" onClick={() => setFees(fees.filter((_, k) => k !== i))} className="p-2 text-[#5B6170]"><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={() => setFees([...fees, { category: "freight", amount: 0, note: "" }])} className={cn(ghost, "flex items-center gap-1 self-start text-xs")}><Plus size={14} /> Add a fee</button>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Supplier<input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={cn(field, "text-sm text-ink")} /></label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Shipping
          <select value={ship} onChange={(e) => setShip(e.target.value)} className={cn(field, "text-sm text-ink")}><option value="air">Air</option><option value="sea">Sea</option><option value="local">Bought locally</option></select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Date bought<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "text-sm text-ink")} /></label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">Note<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Order no., agent…" className={cn(field, "text-sm text-ink")} /></label>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 border-t border-[#EEF0F3] pt-3 tabular-nums">
        {msg && <span role="status" className={cn("mr-auto", msg.ok ? "font-semibold text-success" : "text-sale")}>{msg.text}</span>}
        <span>{units} units · goods <strong>{naira(goods)}</strong> + fees <strong>{naira(extra)}</strong> = <strong>{naira(goods + extra)}</strong></span>
        <button type="button" disabled={saving || lines.length === 0 || lines.some((l) => !l.qty)} onClick={save} className={primary}>{saving ? "Saving…" : "Save purchase"}</button>
      </div>
    </section>
  );
}
