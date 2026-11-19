"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { WholesaleAdmin } from "@/lib/data/admin";
import { cn, naira } from "@/lib/format";
import { call } from "@/lib/net";
import { saveCosts, saveRow } from "../actions";

type Tab = "orders" | "categories" | "kits" | "costs";
const TABS: [Tab, string][] = [["orders", "Wholesale orders"], ["categories", "Categories & margins"], ["kits", "Starter kits"], ["costs", "Costs & fees"]];
const input = "min-h-9 w-full rounded-md border border-[#D0D4DB] bg-white px-2 text-sm";
const PAY: Record<string, string> = { full: "Paid in full", small: "Pay small small" };

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  return msg ? <span role="status" className={cn("text-xs", msg.ok ? "text-success" : "text-[#B42318]")}>{msg.text}</span> : null;
}

export function WholesaleAdminView({ data }: { data: WholesaleAdmin }) {
  const [tab, setTab] = useState<Tab>("orders");
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Wholesale</h1>
        <Link href="/wholesale" className="text-sm font-bold underline">Open the wholesale market</Link>
      </div>
      <p className="text-[#5B6170]">Sea only, {String(data.costs.wholesale_min_qty ?? 10)}+ units per product, no coupons or points. Prices are goods + sea freight and clearing (with a safety buffer) + weighing + the category margin, so a wholesale sale never loses money. Delivery within Nigeria is arranged after customs and billed separately by state.</p>
      <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[#E3E5EA]">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("min-h-11 shrink-0 border-b-2 px-3.5 text-sm", tab === k ? "border-ink font-bold" : "border-transparent text-[#5B6170]")}>{l}</button>
        ))}
      </div>
      {tab === "orders" && <Orders orders={data.orders} />}
      {tab === "categories" && <Categories rows={data.categories} />}
      {tab === "kits" && <Kits rows={data.kits} categories={data.categories.map((c) => c.slug)} />}
      {tab === "costs" && <Costs costs={data.costs} />}
    </>
  );
}

function Orders({ orders }: { orders: WholesaleAdmin["orders"] }) {
  const open = orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status));
  const revenue = orders.filter((o) => !["cancelled", "refunded"].includes(o.status)).reduce((s, o) => s + o.paid_ngn, 0);
  const profit = orders.filter((o) => !["cancelled", "refunded"].includes(o.status)).reduce((s, o) => s + o.profit, 0);
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[["Open orders", String(open.length)], ["Units on order", String(open.reduce((s, o) => s + o.units, 0))], ["Paid so far", naira(revenue)], ["Planned profit", naira(profit)]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[#E3E5EA] bg-white p-3"><dt className="text-xs text-[#5B6170]">{k}</dt><dd className="text-lg font-extrabold">{v}</dd></div>
        ))}
      </dl>
      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#C9CDD4] bg-white p-6 text-center text-[#5B6170]">No wholesale orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E3E5EA] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#F7F8FA] text-xs text-[#5B6170]"><tr>{["Order", "Status", "Pay", "State", "Units", "Total", "Paid", "Placed"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.code} className="border-t border-[#EEF0F3]">
                  <td className="px-3 py-2.5"><Link href={`/admin/orders?q=${o.code}&channel=wholesale`} className="font-mono font-bold underline">#{o.code}</Link></td>
                  <td className="px-3"><span className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-xs font-bold">{o.status.replace("_", " ")}</span></td>
                  <td className="px-3">{PAY[o.pay_mode] ?? o.pay_mode}</td>
                  <td className="px-3">{o.state}</td>
                  <td className="px-3 tabular-nums">{o.units}</td>
                  <td className="px-3 tabular-nums font-bold">{naira(o.total_ngn)}</td>
                  <td className="px-3 tabular-nums">{naira(o.paid_ngn)}</td>
                  <td className="px-3 text-[#5B6170]">{new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[#5B6170]">Purchasing, dispatch and cancellations for these orders work from the usual Orders and Purchasing screens (filter: Wholesale only). Sea orders are marked delivered automatically 90 days after shipping, not 10.</p>
    </div>
  );
}

function Categories({ rows }: { rows: WholesaleAdmin["categories"] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[#5B6170]">Turn categories on or off in the wholesale market, set the wholesale margin (on the goods cost, 10–40%) and the order categories appear in. Saving reprices every product in the category.</p>
      {rows.map((r) => <CategoryRow key={r.id} row={r} />)}
    </div>
  );
}

function CategoryRow({ row: initial }: { row: WholesaleAdmin["categories"][number] }) {
  const [row, setRow] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await call(() => saveRow("categories", { id: row.id, wholesale_enabled: row.wholesale_enabled, wholesale_margin: row.wholesale_margin, wholesale_sort: row.wholesale_sort }));
          setMsg({ ok: r.ok, text: r.message });
        });
      }}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-[#E3E5EA] bg-white p-3"
    >
      <strong className="min-w-40 flex-1 self-center">{row.name}</strong>
      <label className="flex items-center gap-2 text-xs font-semibold text-[#5B6170]"><input type="checkbox" checked={row.wholesale_enabled} onChange={(e) => setRow({ ...row, wholesale_enabled: e.target.checked })} className="size-5" /> In wholesale</label>
      <label className="flex w-28 flex-col gap-1 text-xs font-semibold text-[#5B6170]">Margin %
        <input type="number" min={10} max={40} step="any" value={Math.round(Number(row.wholesale_margin) * 1000) / 10} onChange={(e) => setRow({ ...row, wholesale_margin: Number(e.target.value) / 100 })} className={input} />
      </label>
      <label className="flex w-20 flex-col gap-1 text-xs font-semibold text-[#5B6170]">Order
        <input type="number" value={row.wholesale_sort} onChange={(e) => setRow({ ...row, wholesale_sort: Number(e.target.value) })} className={input} />
      </label>
      <Status msg={msg} />
      <button type="submit" disabled={busy} className="min-h-9 rounded-md bg-ink px-4 font-bold text-white disabled:opacity-50">Save</button>
    </form>
  );
}

const TONES = ["red", "black", "pink", "gold", "green", "blue"];
type KitRow = WholesaleAdmin["kits"][number];

function Kits({ rows, categories }: { rows: KitRow[]; categories: string[] }) {
  const [adding, setAdding] = useState(false);
  const blank: KitRow = { id: 0, slug: "", title: "", subtitle: "", tone: "red", categories: [], max_products: 8, units_each: 10, sort: rows.length + 1, active: true };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[#5B6170]">Starter kits fill themselves with the best sellers from their categories. Customers add a whole kit, then edit their cart. Categories: {categories.join(", ")}.</p>
      {adding ? <KitForm row={blank} isNew categories={categories} /> : (
        <button type="button" onClick={() => setAdding(true)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#9AA1AD] font-bold"><Plus aria-hidden size={16} /> New kit</button>
      )}
      {rows.map((r) => <KitForm key={r.id} row={r} categories={categories} />)}
    </div>
  );
}

function KitForm({ row: initial, isNew, categories }: { row: KitRow; isNew?: boolean; categories: string[] }) {
  const [row, setRow] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const set = <K extends keyof KitRow>(k: K, v: KitRow[K]) => setRow((r) => ({ ...r, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await call(() => saveRow("wholesale_kits", { ...row, id: isNew ? null : row.id }));
          setMsg({ ok: r.ok, text: r.message });
        });
      }}
      className={cn("grid grid-cols-2 gap-2 rounded-lg border bg-white p-3 md:grid-cols-4", isNew ? "border-dashed border-[#9AA1AD]" : "border-[#E3E5EA]")}
    >
      <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">Title<input required value={row.title} onChange={(e) => set("title", e.target.value)} className={input} /></label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">Link name<input required pattern="[a-z0-9-]{3,60}" value={row.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="fashion-store" className={input} /></label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">Colour
        <select value={row.tone} onChange={(e) => set("tone", e.target.value)} className={input}>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-[#5B6170] md:col-span-4">Description<input value={row.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} className={input} /></label>
      <fieldset className="col-span-2 flex flex-wrap gap-1.5 md:col-span-4">
        <legend className="mb-1 text-xs font-semibold text-[#5B6170]">Fill from these categories</legend>
        {categories.map((c) => {
          const on = row.categories.includes(c);
          return (
            <button key={c} type="button" aria-pressed={on} onClick={() => set("categories", on ? row.categories.filter((x) => x !== c) : [...row.categories, c])} className={cn("min-h-8 rounded-full border px-3 text-xs font-bold", on ? "border-ink bg-ink text-white" : "border-[#D0D4DB]")}>{c}</button>
          );
        })}
      </fieldset>
      <label className="flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">Products<input type="number" min={2} max={30} value={row.max_products} onChange={(e) => set("max_products", Number(e.target.value))} className={input} /></label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">Units each<input type="number" min={1} value={row.units_each} onChange={(e) => set("units_each", Number(e.target.value))} className={input} /></label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">Order<input type="number" value={row.sort} onChange={(e) => set("sort", Number(e.target.value))} className={input} /></label>
      <label className="flex items-center gap-2 self-end text-xs font-semibold text-[#5B6170]"><input type="checkbox" checked={row.active} onChange={(e) => set("active", e.target.checked)} className="size-5" /> Live</label>
      <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-4">
        <Status msg={msg} />
        <button type="submit" disabled={busy || !row.categories.length} className="min-h-9 rounded-md bg-ink px-4 font-bold text-white disabled:opacity-50">{isNew ? "Add kit" : "Save"}</button>
      </div>
    </form>
  );
}

const COSTS: [string, string, string][] = [
  ["clearing_per_kg", "Clearing, air (₦/kg)", "1800"],
  ["sea_clearing_per_kg", "Clearing, sea (₦/kg)", "1500"],
  ["weighing_fee_per_item", "Weighing fee (₦/item)", "Every item, retail and wholesale"],
  ["air_per_kg", "Air freight (₦/kg)", ""],
  ["sea_per_cbm", "Sea freight (₦/CBM)", ""],
  ["sea_kg_per_cbm", "Sea: kg per CBM", "Volume estimate for light goods"],
  ["sea_buffer", "Sea safety buffer (0–1)", "0.1 = +10% on sea costs"],
  ["wholesale_min_qty", "Wholesale minimum per product", ""],
];

function Costs({ costs }: { costs: Record<string, unknown> }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(COSTS.map(([k]) => [k, String(costs[k] ?? "")])));
  const [tiers, setTiers] = useState<{ max_kg: number | null; fee: number }[]>(() => (costs.local_delivery_tiers as { max_kg: number | null; fee: number }[]) ?? []);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await call(() => saveCosts({ ...Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Number(x)])), local_delivery_tiers: tiers }));
          setMsg({ ok: r.ok, text: r.message });
        });
      }}
      className="flex flex-col gap-4 rounded-lg border border-[#E3E5EA] bg-white p-4"
    >
      <p className="text-[#5B6170]">Super admin or Finance only. Saving recalculates every retail and wholesale price straight away.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {COSTS.map(([k, l, hint]) => (
          <label key={k} className="flex flex-col gap-1 text-xs font-semibold text-[#5B6170]">{l}
            <input type="number" step="any" min={0} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={input} />
            {hint && <span className="font-normal">{hint}</span>}
          </label>
        ))}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">Local delivery to the pickup station, single items only (by item weight)</legend>
        {tiers.map((t, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
            <span>Up to</span>
            <input aria-label="Up to kg" type="number" step="any" placeholder="any" value={t.max_kg ?? ""} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, max_kg: e.target.value === "" ? null : Number(e.target.value) } : x)))} className={cn(input, "w-24")} />
            <span>kg →</span>
            <input aria-label="Fee ₦" type="number" min={0} value={t.fee} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, fee: Number(e.target.value) } : x)))} className={cn(input, "w-28")} />
            <span>₦</span>
            <button type="button" aria-label="Remove tier" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="flex size-9 items-center justify-center"><Trash2 aria-hidden size={15} /></button>
          </div>
        ))}
        <button type="button" onClick={() => setTiers([...tiers, { max_kg: null, fee: 2000 }])} className="flex items-center gap-1 self-start text-sm font-bold"><Plus aria-hidden size={14} /> Add tier</button>
        <span className="text-xs text-[#5B6170]">Leave the last tier’s kg empty to cover everything heavier. Bulky items (0.1 CBM or more) pay the highest fee.</span>
      </fieldset>
      <div className="flex items-center justify-end gap-2">
        <Status msg={msg} />
        <button type="submit" disabled={busy} className="min-h-10 rounded-md bg-ink px-5 font-bold text-white disabled:opacity-50">Save and reprice</button>
      </div>
    </form>
  );
}
