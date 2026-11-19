"use client";

import { CheckCircle2, ChevronLeft, Loader2, MapPin, Ship } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteData } from "@/components/shop/site-data";
import { StationPicker } from "@/components/shop/station-picker";
import type { Station } from "@/lib/catalog/stations";
import { useNow } from "@/hooks/use-now";
import { addDaysLabel } from "@/lib/time";
import { cn, naira } from "@/lib/format";
import { setStationId, useStationId } from "@/lib/station-store";
import { useWholesaleCart, wcart } from "@/lib/wholesale/cart";
import { SEA_DAYS } from "@/lib/wholesale/rules";
import { addMyStation, myProfile, setMyStation } from "../../auth-actions";
import { useWholesaleQuote } from "../cart/wholesale-cart";
import { placeWholesaleOrder } from "../actions";

/** Wholesale checkout: sea only, no coupons or points, pay in full or small small. */
export function WholesaleCheckout() {
  const lines = useWholesaleCart();
  const quote = useWholesaleQuote(lines);
  const { stations } = useSiteData();
  const stationId = useStationId();
  const [own, setOwn] = useState<Station | null>(null);
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"full" | "small">("full");
  const [weeks, setWeeks] = useState<number | null>(null);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const today = useNow(60_000);

  useEffect(() => {
    myProfile().then((me) => {
      if (!me) return;
      if (me.phone) setPhone((p) => p || me.phone!.replace(/^\+234/, "0"));
      if (me.station) {
        setOwn({ ...me.station, hours: "" });
        setStationId(me.station.id);
      }
    }).catch(() => null);
  }, []);

  const station = stations.find((s) => s.id === stationId) ?? (own && own.id === stationId ? own : null);
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const weekly = weeks ? Math.ceil(total / weeks / 100) * 100 : 0;

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <CheckCircle2 aria-hidden size={52} strokeWidth={1.4} className="text-success" />
        <h1 className="text-[22px] font-extrabold">Wholesale order placed</h1>
        <p className="text-[15px] text-muted">Order <strong className="font-mono text-ink">#{done}</strong>. {mode === "small" ? "Your weekly plan has started; we order your stock when it’s fully paid." : "Complete your payment and we’ll order your stock."} It ships by sea and arrives in about {SEA_DAYS[0]} days.</p>
        <Link href={`/track?code=${done}`} className="min-h-12 rounded-full bg-sale px-6 py-3.5 font-extrabold text-white">Track this order</Link>
        <Link href="/wholesale" className="text-[14px] font-bold underline">Back to the wholesale market</Link>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <Ship aria-hidden size={44} strokeWidth={1.2} className="text-sale" />
        <strong>Your wholesale cart is empty</strong>
        <Link href="/wholesale" className="min-h-11 rounded-full bg-sale px-6 py-3 font-extrabold text-white">Go to the wholesale market</Link>
      </div>
    );
  }

  async function place() {
    setErr("");
    if (!station) return setErr("Choose your pickup station.");
    if (mode === "small" && !weeks) return setErr("Choose how many weeks to pay over.");
    setBusy(true);
    const r = await placeWholesaleOrder({ items: lines.map(({ slug, variantId, qty }) => ({ slug, variantId, qty })), stationId: station.id, phone, mode, weeks: weeks ?? undefined })
      .catch(() => ({ ok: false as const, message: "You seem to be offline. Your cart is saved; try again when you’re connected." }));
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    wcart.clear();
    setDone(r.code);
    window.scrollTo({ top: 0 });
  }

  const box = "flex flex-col gap-3 bg-white p-4 md:rounded-2xl md:border md:border-line";
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2.5 bg-surface pb-36 md:bg-transparent md:pt-6">
      <div className="flex items-center gap-2 border-b border-line bg-white px-2 py-2 md:rounded-2xl md:border">
        <Link href="/wholesale/cart" aria-label="Back to wholesale cart" className="flex size-11 items-center justify-center"><ChevronLeft aria-hidden size={24} /></Link>
        <h1 className="text-[19px] font-extrabold">Wholesale checkout</h1>
      </div>

      <section className={box} aria-labelledby="dl-h">
        <h2 id="dl-h" className="text-[15px] font-extrabold">Delivery</h2>
        <p className="flex items-center gap-2 rounded-xl bg-[#FFF1F2] p-3 text-[13px] text-[#7F0A15]">
          <Ship aria-hidden size={18} className="shrink-0" />
          <span>By sea · arrives {today ? `${addDaysLabel(today, SEA_DAYS[0])} – ${addDaysLabel(today, SEA_DAYS[1])}` : `in ${SEA_DAYS[0]}–${SEA_DAYS[1]} days`} after full payment</span>
        </p>
        {station && !changing ? (
          <button type="button" onClick={() => setChanging(true)} className="flex items-center gap-3 rounded-xl border border-line p-3 text-left">
            <MapPin aria-hidden size={20} className="shrink-0 text-success" />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-[14px]">{station.name}</strong>
              <span className="text-[12px] text-muted">{station.area}, {station.state}{station.verified === false ? " · added by you, we’ll check it" : ""}</span>
            </span>
            <span className="text-[13px] font-bold underline">Change</span>
          </button>
        ) : (
          <StationPicker
            stations={stations}
            selected={station?.id ?? null}
            compact
            onPick={(s) => { setStationId(s.id); void setMyStation(s.id).catch(() => null); setChanging(false); }}
            onAdd={async (p) => {
              const r = await addMyStation(p);
              if (!r.ok) return r.message;
              setOwn({ id: r.id, name: p.name, area: p.area, state: p.state, hours: "", verified: false });
              setStationId(r.id);
              setChanging(false);
              return null;
            }}
          />
        )}
        <label className="flex flex-col gap-1 text-[13px] font-bold">Phone for order updates and your pickup code
          <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" className="min-h-12 rounded-xl border border-line px-3.5 text-[16px] font-normal outline-none focus:border-ink" />
        </label>
      </section>

      <section className={box} aria-labelledby="pay-h">
        <h2 id="pay-h" className="text-[15px] font-extrabold">How to pay</h2>
        <div role="radiogroup" aria-label="How to pay" className="flex flex-col gap-2">
          {([["full", "Pay in full", "Card, transfer, USSD or wallet"], ["small", "Pay small small", "Weekly over 4, 8 or 12 weeks · 0% interest"]] as const).map(([m, t, d]) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left", mode === m ? "border-ink bg-surface" : "border-line")}>
              <span className={cn("size-4 shrink-0 rounded-full border-2", mode === m ? "border-[5px] border-ink" : "border-[#bbb]")} />
              <span className="flex flex-col"><strong className="text-[14px]">{t}</strong><span className="text-[12px] text-muted">{d}</span></span>
            </button>
          ))}
        </div>
        {mode === "small" && (
          <div className="flex flex-wrap gap-2">
            {(quote.plans.length ? quote.plans : [4, 8, 12]).map((w) => (
              <button key={w} type="button" onClick={() => setWeeks(w)} aria-pressed={weeks === w} className={cn("min-h-10 rounded-full border px-4 text-[13px] font-bold", weeks === w ? "border-ink bg-ink text-white" : "border-line")}>{w} weeks</button>
            ))}
            {weeks && <span className="self-center text-[13px] text-muted">{naira(weekly)} a week</span>}
          </div>
        )}
        <p className="text-[12px] text-muted">Coupons, points and sale promotions don’t apply to wholesale: these are already our lowest prices.</p>
      </section>

      <section className={box} aria-labelledby="sum-h">
        <h2 id="sum-h" className="text-[15px] font-extrabold">Order summary</h2>
        <ul className="flex flex-col gap-1 text-[13px]">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{l.qty}× {l.name}{l.label ? ` · ${l.label}` : ""}</span>
              <span className="shrink-0 tabular-nums">{naira(l.qty * l.unit)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-line pt-2 text-[13px]">
          <div className="flex justify-between"><dt className="text-muted">Units</dt><dd>{units}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Sea freight, clearing, weighing, delivery</dt><dd className="font-semibold text-success">Included</dd></div>
          <div className="flex justify-between text-[16px] font-extrabold"><dt>Total</dt><dd className="tabular-nums">{naira(total)}</dd></div>
        </dl>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white px-3 py-3 md:bottom-0">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {err && <p role="alert" className="text-[13px] font-semibold text-sale">{err}</p>}
          <button type="button" onClick={() => void place()} disabled={busy || quote.missing > 0} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-sale text-[15px] font-extrabold text-white disabled:opacity-50">
            {busy && <Loader2 aria-hidden size={17} className="animate-spin" />}
            Place wholesale order · {naira(mode === "small" && weeks ? weekly : total)}{mode === "small" && weeks ? " now" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
