"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import type { EditorData } from "@/lib/data/admin";
import { cn } from "@/lib/format";
import { saveRow } from "../actions";
import { call } from "@/lib/net";

type Kind = "text" | "number" | "date" | "bool" | "color" | "theme" | "textarea";
interface Field { key: string; label: string; kind: Kind; wide?: boolean }
type Row = Record<string, string | number | boolean | null>;

const TABS = {
  coupons: {
    title: "Coupons", table: "coupons",
    note: "Fill either “₦ off” or “% off”. A % coupon must have a maximum. Guardrails still cap every coupon at 25% of an order’s profit.",
    fields: [
      { key: "id", label: "Code", kind: "text" }, { key: "label", label: "Card label", kind: "text" }, { key: "title", label: "Title", kind: "text" },
      { key: "rule", label: "Rule shown", kind: "text", wide: true }, { key: "amount_ngn", label: "₦ off", kind: "number" }, { key: "percent", label: "% off", kind: "number" },
      { key: "max_off_ngn", label: "Max ₦ off", kind: "number" }, { key: "min_spend_ngn", label: "Min spend ₦", kind: "number" },
      { key: "gadget_only", label: "Gadgets only", kind: "bool" }, { key: "active", label: "Live", kind: "bool" },
    ] as Field[],
    blank: { id: "", label: "", title: "", rule: "", amount_ngn: null, percent: null, max_off_ngn: null, min_spend_ngn: 0, gadget_only: false, active: false },
  },
  events: {
    title: "Sale events", table: "sale_events",
    note: "The site theme and home banner switch by themselves on these Lagos dates. Use a line break in the title for two lines.",
    fields: [
      { key: "name", label: "Name", kind: "text" }, { key: "starts_on", label: "Starts", kind: "date" }, { key: "ends_on", label: "Ends", kind: "date" },
      { key: "theme", label: "Theme", kind: "theme" }, { key: "early_access_days", label: "Early access days", kind: "number" }, { key: "color", label: "Colour", kind: "color" },
      { key: "kicker", label: "Small heading", kind: "text", wide: true }, { key: "title", label: "Big title", kind: "textarea" }, { key: "sub", label: "Line under", kind: "text", wide: true },
      { key: "active", label: "Live", kind: "bool" },
    ] as Field[],
    blank: { name: "", starts_on: "", ends_on: "", theme: "everyday", kicker: "", title: "", sub: "", color: "#111111", early_access_days: 0, active: false },
  },
  stations: {
    title: "Pickup stations", table: "pickup_stations",
    note: "Only active, checked stations show to everyone. Stations customers add start unchecked: confirm the name and address, then tick Checked. Latitude/longitude power “nearest station”.",
    fields: [
      { key: "id", label: "Code", kind: "text" }, { key: "state", label: "State", kind: "text" }, { key: "area", label: "Area", kind: "text" },
      { key: "name", label: "Station name", kind: "text", wide: true }, { key: "address", label: "Address", kind: "text", wide: true }, { key: "hours", label: "Opening hours", kind: "text" },
      { key: "lat", label: "Latitude", kind: "number" }, { key: "lng", label: "Longitude", kind: "number" },
      { key: "verified", label: "Checked", kind: "bool" }, { key: "active", label: "Active", kind: "bool" },
    ] as Field[],
    blank: { id: "", state: "", area: "", name: "", address: "", hours: "", lat: null, lng: null, verified: true, active: true },
  },
} as const;
type TabKey = keyof typeof TABS;

function RowEditor({ row: initial, tab, isNew }: { row: Row; tab: TabKey; isNew?: boolean }) {
  const t = TABS[tab];
  const [row, setRow] = useState<Row>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const set = (k: string, v: Row[string]) => setRow((r) => ({ ...r, [k]: v }));
  const input = "min-h-9 w-full rounded-md border border-[#D0D4DB] bg-white px-2 text-sm";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await call(() => saveRow(t.table, row));
          setMsg({ ok: r.ok, text: r.message });
        });
      }}
      className={cn("grid grid-cols-2 gap-2 rounded-lg border bg-white p-3 md:grid-cols-4 xl:grid-cols-6", isNew ? "border-dashed border-[#9AA1AD]" : "border-[#E3E5EA]")}
    >
      {t.fields.map((f) => (
        <label key={f.key} className={cn("flex flex-col gap-1 text-xs font-semibold text-[#5B6170]", (f.wide || f.kind === "textarea") && "col-span-2")}>
          {f.label}
          {f.kind === "bool" ? (
            <input type="checkbox" checked={Boolean(row[f.key])} onChange={(e) => set(f.key, e.target.checked)} className="size-5" />
          ) : f.kind === "theme" ? (
            <select value={String(row[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} className={input}>
              {["everyday", "black-friday", "gadget-hunt", "christmas", "valentine"].map((x) => <option key={x}>{x}</option>)}
            </select>
          ) : f.kind === "textarea" ? (
            <textarea rows={2} value={String(row[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} className={input} />
          ) : (
            <input
              type={f.kind === "number" ? "number" : f.kind}
              step={f.kind === "number" ? "any" : undefined}
              value={row[f.key] === null ? "" : String(row[f.key])}
              readOnly={!isNew && f.key === "id"}
              onChange={(e) => set(f.key, f.kind === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
              className={cn(input, !isNew && f.key === "id" && "bg-[#F4F5F7]")}
            />
          )}
        </label>
      ))}
      <div className="col-span-2 flex items-end justify-end gap-2 md:col-span-4 xl:col-span-6">
        {msg && <span role="status" className={cn("text-xs", msg.ok ? "text-success" : "text-[#B42318]")}>{msg.text}</span>}
        <button type="submit" disabled={busy} className="min-h-9 rounded-md bg-ink px-4 font-bold text-white disabled:opacity-50">{isNew ? "Add" : "Save"}</button>
      </div>
    </form>
  );
}

export function SettingsView({ data }: { data: EditorData }) {
  const [tab, setTab] = useState<TabKey>("coupons");
  const [adding, setAdding] = useState(false);
  const rows = (tab === "coupons" ? data.coupons : tab === "events" ? data.events : data.stations) as unknown as Row[];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Coupons, events &amp; stations</h1>
      <div role="tablist" className="flex gap-1 border-b border-[#E3E5EA]">
        {(Object.keys(TABS) as TabKey[]).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => { setTab(k); setAdding(false); }} className={cn("min-h-11 border-b-2 px-3.5 text-sm", tab === k ? "border-ink font-bold" : "border-transparent text-[#5B6170]")}>
            {TABS[k].title}
          </button>
        ))}
      </div>
      <p className="text-[#5B6170]">{TABS[tab].note}</p>
      <div className="flex flex-col gap-2">
        {adding ? (
          <RowEditor key={`${tab}-new`} tab={tab} row={{ ...TABS[tab].blank }} isNew />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#9AA1AD] font-bold"><Plus aria-hidden size={16} /> Add</button>
        )}
        {rows.map((r) => <RowEditor key={`${tab}-${String(r.id)}`} tab={tab} row={r} />)}
      </div>
    </>
  );
}
