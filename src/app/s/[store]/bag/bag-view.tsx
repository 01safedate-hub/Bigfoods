"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProductTile } from "@/components/shop/product-card";
import { useOnline } from "@/hooks/use-online";
import { type Station, statesOf } from "@/lib/catalog/stations";
import { cn, naira } from "@/lib/format";
import { attempt } from "@/lib/net";
import { buildSchedule, planOptions } from "@/lib/payments/instalments";
import { useBag } from "../../bag-provider";
import { placeStoreOrder } from "../../actions";

export function BagView({ store, storeKey, open, allowSmall, stations }: { store: string; storeKey: string; open: boolean; allowSmall: boolean; stations: Station[] }) {
  const { items, setQty, clear } = useBag();
  const router = useRouter();
  const online = useOnline();
  const states = statesOf(stations);
  const [state, setState] = useState(states[0] ?? "");
  const [station, setStation] = useState(stations.find((s) => s.state === states[0])?.id ?? "");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"full" | "small">("full");
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const weeksOk = allowSmall ? planOptions(total) : [];
  const [weeks, setWeeks] = useState(4);
  const w = weeksOk.includes(weeks) ? weeks : weeksOk[0];
  const schedule = w ? buildSchedule(total, w, 0) : [];
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const base = `/s/${storeKey}`;
  const field = "min-h-12 w-full rounded-[var(--st-radius)] border border-[var(--st-line)] bg-[var(--st-bg)] px-3 text-[15px]";

  if (!items.length) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-[26px] font-bold">Your bag is empty</h1>
        <Link href={base} className="min-h-12 rounded-[var(--st-radius)] px-6 py-3 font-bold text-white" style={{ background: "var(--st-accent)" }}>Keep shopping</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1.2fr_1fr] md:px-6">
      <section>
        <h1 className="mb-4 text-[26px] font-bold">Your bag</h1>
        <ul className="flex flex-col divide-y divide-[var(--st-line)]">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3 py-3">
              <ProductTile tint={i.tint} icon={i.icon} name={i.name} image={i.image} className="size-20 shrink-0 rounded-[var(--st-radius)]" iconSize={30} sizes="80px" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <strong className="line-clamp-2 text-[14px] font-semibold">{i.name}</strong>
                {i.variantLabel && <span className="text-[13px] text-[var(--st-muted)]">{i.variantLabel}</span>}
                <span className="mt-auto flex items-center justify-between">
                  <span className="flex items-center rounded-full border border-[var(--st-line)]">
                    <button type="button" aria-label="One fewer" onClick={() => setQty(i.variantId, i.qty - 1)} className="flex size-9 items-center justify-center"><Minus aria-hidden size={14} /></button>
                    <span className="w-6 text-center text-[14px] tabular-nums" aria-label="Quantity">{i.qty}</span>
                    <button type="button" aria-label="One more" onClick={() => setQty(i.variantId, i.qty + 1)} className="flex size-9 items-center justify-center"><Plus aria-hidden size={14} /></button>
                  </span>
                  <strong className="tabular-nums">{naira(i.price * i.qty)}</strong>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <form
        className="flex flex-col gap-4 rounded-[var(--st-radius)] bg-[var(--st-card)] p-4 md:self-start"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setMsg(null);
            const r = await attempt(() => placeStoreOrder({ store, items: items.map((i) => ({ slug: i.slug, variantId: i.variantId, qty: i.qty })), stationId: station, phone, mode, weeks: w }));
            if (!r.ok) return setMsg(r.message);
            if (!r.value.ok) return setMsg(r.value.message);
            try {
              sessionStorage.setItem(`fc-track-${r.value.code}`, phone.replace(/\D/g, "").slice(-4));
            } catch {}
            clear();
            router.push(`/track?code=${r.value.code}`);
          });
        }}
      >
        <h2 className="text-[18px] font-bold">Delivery</h2>
        <label className="flex flex-col gap-1 text-[13px] font-semibold">State
          <select value={state} onChange={(e) => { setState(e.target.value); setStation(stations.find((s) => s.state === e.target.value)?.id ?? ""); }} className={field}>
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold">Jumia pickup station
          <select value={station} onChange={(e) => setStation(e.target.value)} className={field}>
            {stations.filter((s) => s.state === state).map((s) => <option key={s.id} value={s.id}>{s.name} · {s.hours}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold">Phone for delivery updates
          <input type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" className={field} />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-semibold">How to pay</legend>
          {(allowSmall ? ([["full", "Pay in full"], ["small", "Pay small small · 0% weekly"]] as const) : ([["full", "Pay in full"]] as const)).map(([k, label]) => (
            <label key={k} className={cn("flex min-h-12 cursor-pointer items-center gap-2 rounded-[var(--st-radius)] border px-3 text-[14px]", mode === k ? "border-[var(--st-fg)] font-bold" : "border-[var(--st-line)]", k === "small" && !weeksOk.length && "opacity-40")}>
              <input type="radio" name="mode" className="size-4 accent-[var(--st-accent)]" checked={mode === k} disabled={k === "small" && !weeksOk.length} onChange={() => setMode(k)} /> {label}
            </label>
          ))}
          {mode === "small" && weeksOk.length > 0 && (
            <span className="flex flex-wrap gap-2 text-[13px]">
              {weeksOk.map((n) => <button key={n} type="button" aria-pressed={w === n} onClick={() => setWeeks(n)} className={cn("min-h-10 rounded-full border px-3", w === n ? "border-[var(--st-fg)] font-bold" : "border-[var(--st-line)]")}>{n} weeks</button>)}
              <span className="w-full text-[var(--st-muted)]">{naira(schedule[0]?.amount ?? 0)} today, then {naira(schedule[1]?.amount ?? 0)} a week.</span>
            </span>
          )}
        </fieldset>
        <div className="flex items-baseline justify-between border-t border-[var(--st-line)] pt-3">
          <span>Total <span className="text-[13px] text-[var(--st-muted)]">· delivery free</span></span>
          <strong className="text-[22px] tabular-nums">{naira(total)}</strong>
        </div>
        {msg && <p role="alert" className="text-[13px] font-semibold text-[#DC2626]">{msg}</p>}
        <button type="submit" disabled={busy || !open || !online || !station} className="min-h-14 rounded-[var(--st-radius)] text-[16px] font-bold text-white disabled:opacity-40" style={{ background: "var(--st-accent)" }}>
          {busy ? "Placing order…" : !online ? "Offline" : !open ? "Not taking orders right now" : mode === "small" ? `Pay ${naira(schedule[0]?.amount ?? total)} today` : `Pay ${naira(total)}`}
        </button>
        <p className="text-center text-[12px] text-[var(--st-muted)]">Secure payment · Fulfilled and delivered by FastChina</p>
      </form>
    </div>
  );
}
