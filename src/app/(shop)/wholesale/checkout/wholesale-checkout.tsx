"use client";

import { CheckCircle2, ChevronLeft, Loader2, Ship } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { addDaysLabel } from "@/lib/time";
import { cn, naira } from "@/lib/format";
import { useWholesaleCart, wcart } from "@/lib/wholesale/cart";
import { SEA_DAYS } from "@/lib/wholesale/rules";
import { NIGERIAN_STATES } from "@/lib/geo";
import { myProfile } from "../../auth-actions";
import { useWholesaleQuote } from "../cart/wholesale-cart";
import { placeWholesaleOrder } from "../actions";

/** Wholesale checkout: sea only, no coupons or points, pay in full or small small. */
export function WholesaleCheckout() {
  const lines = useWholesaleCart();
  const quote = useWholesaleQuote(lines);
  const [delivery, setDelivery] = useState({ state: "", city: "", address: "" });
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"full" | "small">("full");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const today = useNow(60_000);

  useEffect(() => {
    myProfile().then((me) => {
      if (!me) return;
      if (me.phone) setPhone((p) => p || me.phone!.replace(/^\+234/, "0"));
      if (me.station) setDelivery((d) => (d.state ? d : { ...d, state: me.station!.state, city: me.station!.area }));
    }).catch(() => null);
  }, []);

  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <CheckCircle2 aria-hidden size={52} strokeWidth={1.4} className="text-success" />
        <h1 className="text-[22px] font-extrabold">Wholesale order placed</h1>
        <p className="text-[15px] text-muted">Order <strong className="font-mono text-ink">#{done}</strong>. {mode === "small" ? "Your Pay small small plan has started. Pay any amount, any time; we order your stock once it’s fully paid." : "Complete your payment and we’ll order your stock."} It ships by sea; we’ll call you to arrange delivery when it clears customs (about {SEA_DAYS[0]} days).</p>
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
    if (!delivery.state || delivery.city.trim().length < 2) return setErr("Enter your state and city for delivery.");
    if (mode === "small" && !quote.smallOk) return setErr("Pay small small starts from ₦10,000.");
    setBusy(true);
    const r = await placeWholesaleOrder({ items: lines.map(({ slug, variantId, qty }) => ({ slug, variantId, qty })), delivery, phone, mode })
      .catch(() => ({ ok: false as const, message: "You seem to be offline. Your cart is saved; try again when you’re connected." }));
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    wcart.clear();
    setDone(r.code);
    window.scrollTo({ top: 0 });
  }

  const box = "flex flex-col gap-3 bg-white p-4 md:rounded-2xl md:border md:border-line";
  return (
    <div className="flex w-full flex-col gap-2.5 bg-surface pb-36 md:bg-transparent md:pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-8 lg:pb-10">
      <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex items-center gap-2 border-b border-line bg-white px-2 py-2 md:rounded-2xl md:border">
        <Link href="/wholesale/cart" aria-label="Back to wholesale cart" className="flex size-11 items-center justify-center"><ChevronLeft aria-hidden size={24} /></Link>
        <h1 className="text-[19px] font-extrabold">Wholesale checkout</h1>
      </div>

      <section className={box} aria-labelledby="dl-h">
        <h2 id="dl-h" className="text-[15px] font-extrabold">Delivery</h2>
        <p className="flex items-center gap-2 rounded-xl bg-[#FFF1F2] p-3 text-[13px] text-[#7F0A15]">
          <Ship aria-hidden size={18} className="shrink-0" />
          <span>By sea · clears customs in Lagos {today ? `${addDaysLabel(today, SEA_DAYS[0])} – ${addDaysLabel(today, SEA_DAYS[1])}` : `in ${SEA_DAYS[0]}–${SEA_DAYS[1]} days`} after full payment</span>
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] font-bold">State
            <select required value={delivery.state} onChange={(e) => setDelivery({ ...delivery, state: e.target.value })} className="min-h-12 rounded-xl border border-line bg-white px-3 text-[16px] font-normal outline-none focus:border-ink">
              <option value="">Choose your state</option>
              {NIGERIAN_STATES.map((st) => <option key={st}>{st}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-bold">City or town
            <input required value={delivery.city} onChange={(e) => setDelivery({ ...delivery, city: e.target.value })} placeholder="e.g. Onitsha" className="min-h-12 rounded-xl border border-line px-3.5 text-[16px] font-normal outline-none focus:border-ink" />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-bold sm:col-span-2">Shop or delivery address <span className="font-normal text-muted">(optional now)</span>
            <input value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} placeholder="Street, market or landmark" className="min-h-12 rounded-xl border border-line px-3.5 text-[16px] font-normal outline-none focus:border-ink" />
          </label>
        </div>
        <p className="rounded-xl bg-surface p-3 text-[12px] leading-relaxed text-muted">No pickup station needed. When your stock clears customs in Lagos we call you to arrange delivery to {delivery.state || "your state"}. Local delivery is billed separately at the rate for your state.</p>
        <label className="flex flex-col gap-1 text-[13px] font-bold">Phone for order updates and your pickup code
          <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" className="min-h-12 rounded-xl border border-line px-3.5 text-[16px] font-normal outline-none focus:border-ink" />
        </label>
      </section>

      <section className={box} aria-labelledby="pay-h">
        <h2 id="pay-h" className="text-[15px] font-extrabold">How to pay</h2>
        <div role="radiogroup" aria-label="How to pay" className="flex flex-col gap-2">
          {([["full", "Pay in full", "Card, transfer, USSD or wallet"], ["small", "Pay small small", "Any amount, any time · 0% interest · no deadlines"]] as const).map(([m, t, d]) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left", mode === m ? "border-ink bg-surface" : "border-line")}>
              <span className={cn("size-4 shrink-0 rounded-full border-2", mode === m ? "border-[5px] border-ink" : "border-[#bbb]")} />
              <span className="flex flex-col"><strong className="text-[14px]">{t}</strong><span className="text-[12px] text-muted">{d}</span></span>
            </button>
          ))}
        </div>
        {mode === "small" && (
          <p className="text-[13px] text-muted">Pay what you can now and the rest whenever you like. Your price is locked, and we order your stock as soon as it’s fully paid.</p>
        )}
        <p className="text-[12px] text-muted">Coupons, points and sale promotions don’t apply to wholesale: these are already our lowest prices.</p>
      </section>

      </div>

      <section className={`${box} lg:sticky lg:top-28`} aria-labelledby="sum-h">
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
          <div className="flex justify-between"><dt className="text-muted">Sea freight, clearing, weighing</dt><dd className="font-semibold text-success">Included</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery within Nigeria</dt><dd className="font-semibold">Billed by state later</dd></div>
          <div className="flex justify-between text-[16px] font-extrabold"><dt>Total</dt><dd className="tabular-nums">{naira(total)}</dd></div>
        </dl>
        <div className="hidden flex-col gap-2 lg:flex">
          {err && <p role="alert" className="text-[13px] font-semibold text-sale">{err}</p>}
          <button type="button" onClick={() => void place()} disabled={busy || quote.missing > 0} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-sale text-[15px] font-extrabold text-white disabled:opacity-50">
            {busy && <Loader2 aria-hidden size={17} className="animate-spin" />}
            Place wholesale order
          </button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(49px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white px-3 py-3 md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {err && <p role="alert" className="text-[13px] font-semibold text-sale">{err}</p>}
          <button type="button" onClick={() => void place()} disabled={busy || quote.missing > 0} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-sale text-[15px] font-extrabold text-white disabled:opacity-50">
            {busy && <Loader2 aria-hidden size={17} className="animate-spin" />}
            {mode === "small" ? "Place order · start paying small small" : `Place wholesale order · ${naira(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
