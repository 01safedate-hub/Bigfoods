"use client";

import { ChevronDown, ChevronLeft, ChevronUp, Copy, Lock, MapPin, Plane } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useCart } from "@/components/shop/cart-provider";
import { useLivePromo } from "@/components/shop/live-price";
import { ProductTile } from "@/components/shop/product-card";
import { useClaimed } from "@/components/shop/promos";
import { InfoButton } from "@/components/ui/info-button";
import { Progress } from "@/components/ui/progress";
import { useNow } from "@/hooks/use-now";
import { statesOf } from "@/lib/catalog/stations";
import { useSiteData } from "@/components/shop/site-data";
import { cn, naira } from "@/lib/format";
import { productTotals, unitFromPrices } from "@/lib/pricing/prices";
import { buildSchedule, planOptions, SMALL_SMALL } from "@/lib/payments/instalments";
import { type CheckoutQuote, placeOrder, quoteCheckout } from "../actions";
import { addDaysLabel } from "@/lib/time";
import { useOnline } from "@/hooks/use-online";
import { attempt } from "@/lib/net";

type Mode = "full" | "small" | "group";

export function CheckoutView() {
  const params = useSearchParams();
  const initial = params.get("pay");
  const [mode, setMode] = useState<Mode>(initial === "small" || initial === "group" ? initial : "full");
  const { items, remove } = useCart();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [placing, startPlacing] = useTransition();
  const [placeMsg, setPlaceMsg] = useState<string | null>(null);
  const promo = useLivePromo();
  const now = useNow(60_000);
  const [claimed] = useClaimed();
  const [state, setState] = useState<string>("Lagos");
  const { stations: STATIONS } = useSiteData();
  const STATES = statesOf(STATIONS);
  const [station, setStation] = useState<string>(STATIONS[0]?.id ?? "");
  const [method, setMethod] = useState("Card");
  const [plan, setPlan] = useState(4);
  const [usePoints, setUsePoints] = useState(false);
  const [mine, setMine] = useState(50_000);
  const [others, setOthers] = useState<number[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const selected = items.filter((i) => i.selected);
  const totals = productTotals(selected);
  const unitOf = (i: (typeof selected)[number]) => unitFromPrices(i.snap.prices, i.qty, promo, totals.get(i.slug));

  // The total, coupon and points are worked out on the server with the guardrails; the browser never sees costs.
  const [serverQuote, setServerQuote] = useState<CheckoutQuote | null>(null);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const online = useOnline();
  const requestKey = JSON.stringify([selected.map((i) => [i.slug, i.variantId, i.qty]), claimed, usePoints]);
  useEffect(() => {
    let live = true;
    quoteCheckout(selected.map((i) => ({ slug: i.slug, variantId: i.variantId, qty: i.qty })), { claimedCouponIds: claimed, usePoints })
      .then((q) => {
        if (!live) return;
        setServerQuote(q);
        setQuoteFailed(false);
      })
      .catch(() => {
        if (!live) return;
        setServerQuote(null);
        setQuoteFailed(true);
      });
    return () => {
      live = false;
    };
    // requestKey captures every input that changes the quote.
    // Re-quote when connection comes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, online]);

  const estimateList = selected.reduce((s, i) => s + i.snap.prices.list * i.qty, 0);
  const estimate = selected.reduce((s, i) => s + unitOf(i) * i.qty, 0);
  const quote = serverQuote ?? { subtotalList: estimateList, subtotal: estimate, priceSavings: estimateList - estimate, coupon: 0, couponLabel: null, couponNote: undefined, points: 0, pointsBalance: 0, total: estimate, lines: [], missing: 0, promo };
  const best = quote.couponLabel ? { label: quote.couponLabel } : null;
  const due = quote.total;
  // Pay small small: only plan lengths this total allows; the schedule adds up to the total exactly.
  const planChoices = planOptions(due);
  const weeks = planChoices.includes(plan) ? plan : (planChoices[0] ?? plan);
  const schedule = planChoices.length ? buildSchedule(due, weeks, 0) : [];
  const weekly = schedule[0]?.amount ?? 0;
  const lineTotal = (i: (typeof selected)[number]) => {
    const l = quote.lines.find((x) => x.slug === i.slug && x.variantId === i.variantId);
    return (l ? l.unit : unitOf(i)) * i.qty;
  };

  // Group pay: contributions arrive live (simulated here until Supabase Realtime is connected).
  useEffect(() => {
    if (mode !== "group") return;
    const feed = [15_000, 5_000, 20_000, 10_000, 3_000, 25_000];
    let k = 0;
    const id = setInterval(() => {
      if (k < feed.length) setOthers((o) => [...o, feed[k++]]);
    }, 2500);
    return () => clearInterval(id);
  }, [mode]);

  const keys = selected.map((i) => i.key);
  const ordered = [...order.filter((k) => keys.includes(k)), ...keys.filter((k) => !order.includes(k))];
  const funded = Math.min(due, mine + others.reduce((a, b) => a + b, 0));
  let pool = funded;
  const allocation = ordered.map((key) => {
    const it = selected.find((i) => i.key === key)!;
    const price = lineTotal(it);
    const got = Math.max(0, Math.min(price, pool));
    pool -= got;
    return { it, price, got, done: got >= price };
  });
  const paidCount = allocation.filter((a) => a.done).length;
  const move = (i: number, d: number) => {
    const o = [...ordered];
    const j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o);
  };

  const stations = STATIONS.filter((s) => s.state === state);
  const eta = now ? `${addDaysLabel(now, 10)} – ${addDaysLabel(now, 18)}` : "in 10–18 days";
  const cta = mode === "full" ? `PAY ${naira(due)}` : mode === "small" ? (weekly ? `PAY ${naira(weekly)} TODAY` : `PAY ${naira(due)} IN FULL`) : mine ? `PAY ${naira(mine)} & SHARE LINK` : "CREATE LINK";

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-lg font-extrabold">Nothing to check out</h1>
        <Link href="/cart" className="bg-ink px-5 py-3 font-extrabold text-white">BACK TO CART</Link>
      </div>
    );
  }

  const radio = (on: boolean) => cn("flex min-h-[46px] w-full items-center gap-2.5 rounded-md border-[1.5px] bg-white p-2.5 text-left text-[13px]", on ? "border-ink" : "border-[#e6e6e6]");
  const dot = (on: boolean) => cn("size-4 shrink-0 rounded-full", on ? "border-[5px] border-ink" : "border-[1.5px] border-[#999]");
  const chip = (on: boolean) => cn("min-h-[38px] border-[1.5px] px-2.5 text-xs font-bold", on ? "border-ink bg-ink text-white" : "border-black/15 bg-white");

  return (
    <div className="flex flex-col gap-2 bg-surface pb-32 lg:grid lg:grid-cols-[1fr_380px] lg:items-start md:gap-6 md:bg-transparent md:pt-6 md:pb-10">
      <div className="flex flex-col gap-2 md:gap-4">
        <div className="flex items-center gap-1.5 bg-white px-2 py-1 md:px-0">
          <Link href="/cart" aria-label="Back to cart" className="flex h-11 w-10 items-center justify-center md:hidden">
            <ChevronLeft aria-hidden size={22} />
          </Link>
          <h1 className="flex-1 text-[17px] font-extrabold md:text-2xl">Checkout</h1>
          <span className="flex items-center gap-1 pr-1.5 text-xs font-bold text-success">
            <Lock aria-hidden size={14} /> Secure
          </span>
        </div>

        {/* Pickup */}
        <section className="flex flex-col gap-2.5 bg-white p-3 md:rounded-md md:border md:border-line md:p-4">
          <span className="flex items-center">
            <h2 className="text-sm font-bold">1. Jumia pickup station</h2>
            <InfoButton topic="shipping" />
          </span>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs font-bold">
              State
              <select value={state} onChange={(e) => { setState(e.target.value); setStation(STATIONS.find((s) => s.state === e.target.value)!.id); }} className="min-h-11 border border-black/15 bg-white px-2 text-sm font-normal">
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold">
              Phone for SMS
              <input type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" className="min-h-11 border border-black/15 px-2 text-sm font-normal" />
            </label>
          </div>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Pickup station">
            {stations.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={station === s.id} onClick={() => setStation(s.id)} className={radio(station === s.id)}>
                <span className={dot(station === s.id)} />
                <MapPin aria-hidden size={16} className="shrink-0" />
                <span className="flex flex-1 flex-col">
                  <strong>{s.name}</strong>
                  <span className="text-xs text-muted">{s.hours}</span>
                </span>
                <span className="text-xs font-bold text-success">FREE</span>
              </button>
            ))}
          </div>
        </section>

        {/* Items */}
        <section className="flex flex-col gap-2 bg-white p-3 md:rounded-md md:border md:border-line md:p-4">
          <div className="flex items-center justify-between">
            <strong className="flex items-center gap-1.5 text-sm"><Plane aria-hidden size={16} /> {selected.length} {selected.length === 1 ? "item" : "items"}</strong>
            <span className="text-xs font-bold text-success">Arrives {eta}</span>
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {selected.map((i) => <ProductTile key={i.key} tint={i.snap.tint} icon={i.snap.icon} name={i.snap.name} image={i.snap.image} sizes="64px" className="h-[76px] w-16 shrink-0" iconSize={30} />)}
          </div>
        </section>

        {/* Pay */}
        <section className="flex flex-col gap-2.5 bg-white p-3 md:rounded-md md:border md:border-line md:p-4">
          <span className="flex items-center">
            <h2 className="text-sm font-bold">2. How do you want to pay?</h2>
            <InfoButton topic="pay" />
          </span>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Payment type">
            {([["full", "Pay in full", "Card · transfer"], ["small", "Small small", "Weekly, 0%"], ["group", "Group pay", "Friends chip in"]] as const).map(([id, t, s]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={cn("flex min-h-[58px] flex-col items-start gap-0.5 rounded-md border-[1.5px] bg-white px-2 py-2.5 text-left", mode === id ? "border-ink" : "border-[#e6e6e6]")}>
                <strong className="text-xs md:text-sm">{t}</strong>
                <span className="text-[10px] text-muted md:text-xs">{s}</span>
              </button>
            ))}
          </div>

          {mode === "full" && (
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Payment method">
              {["Card (Visa, Mastercard, Verve)", "Bank transfer", "USSD", "FastChina wallet · ₦0"].map((m) => (
                <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className={radio(method === m)}>
                  <span className={dot(method === m)} />
                  {m}
                </button>
              ))}
            </div>
          )}

          {mode === "small" && (
            <div className="flex flex-col gap-2">
              {planChoices.length === 0 ? (
                <span className="text-muted">Pay small small starts from {naira(SMALL_SMALL.minOrder)}. Add a little more to your cart to use it.</span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    {SMALL_SMALL.weekOptions.map((n) => (
                      <button key={n} type="button" disabled={!planChoices.includes(n)} aria-pressed={weeks === n} onClick={() => setPlan(n)} className={cn(chip(weeks === n), "disabled:opacity-35")}>{n} weeks</button>
                    ))}
                    <InfoButton topic="smallsmall" />
                  </span>
                  <ol>
                    {schedule.slice(0, 3).map((i) => (
                      <li key={i.n} className="flex justify-between border-b border-dashed border-[#e2e2e2] py-1.5">
                        <span>{i.n === 1 ? "Today" : now ? addDaysLabel(now, 7 * (i.n - 1)) : `Week ${i.n}`} · payment {i.n} of {weeks}</span>
                        <strong>{naira(i.amount)}</strong>
                      </li>
                    ))}
                    {weeks > 3 && <li className="py-1.5 text-muted">+ {weeks - 3} more weekly {weeks - 3 === 1 ? "payment" : "payments"} of {naira(schedule[1]?.amount ?? 0)}</li>}
                  </ol>
                  <span className="leading-relaxed text-muted">0% interest. Adds up to exactly {naira(due)}. Today’s price is locked. We order from the factory when your last payment clears.</span>
                </>
              )}
            </div>
          )}

          {mode === "group" && (
            <div className="flex flex-col gap-2.5 rounded-md bg-group-soft p-2.5">
              <span className="flex items-center justify-between font-bold">
                You pay now
                <InfoButton topic="group" />
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[0, 50_000, 100_000, due].map((v) => (
                  <button key={v} type="button" aria-pressed={mine === v} onClick={() => setMine(v)} className={chip(mine === v)}>
                    {v === due ? "All of it" : naira(v)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-2.5">
                <span className="text-xs text-muted">Your link · open for 7 days</span>
                <strong className="font-mono text-[13px]">fastchina.shop/c/TOLU-7K2X</strong>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText("https://fastchina.shop/c/TOLU-7K2X").catch(() => {});
                      setCopied(true);
                    }}
                    className="flex min-h-10 items-center justify-center gap-1.5 border border-ink text-xs font-extrabold"
                  >
                    <Copy aria-hidden size={14} /> {copied ? "COPIED" : "COPY LINK"}
                  </button>
                  <Link href="/c/TOLU-7K2X" className="flex min-h-10 items-center justify-center bg-success text-xs font-extrabold text-white">WHATSAPP</Link>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex justify-between">
                  <strong>{naira(funded)} of {naira(due)}</strong>
                  <span className="font-bold text-group">● Live · {others.length + (mine ? 1 : 0)} people</span>
                </span>
                <Progress value={(funded / due) * 100} className="h-2 bg-[#E0DEF7]" barClass="bg-group" label="Group pay progress" />
              </div>
              <span className="font-bold">Pay order (top first)</span>
              {allocation.map(({ it, price, got, done }, idx) => (
                <div key={it.key} className="flex items-center gap-2 rounded-md bg-white p-2">
                  <ProductTile tint={it.snap.tint} icon={it.snap.icon} name={it.snap.name} image={it.snap.image} sizes="40px" className="h-11 w-9 shrink-0" iconSize={18} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate">{it.snap.name} · {naira(price)}</span>
                    <Progress value={(got / price) * 100} className="h-1" barClass={done ? "bg-[#16A34A]" : "bg-group"} label={`${it.snap.name} paid`} />
                    <span className={cn("text-[11px] font-bold", done ? "text-success" : "text-muted")}>{done ? "Paid · ready to ship" : `${Math.round((got / price) * 100)}% paid`}</span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <button type="button" aria-label="Pay this item sooner" onClick={() => move(idx, -1)} className="flex h-6 w-8 items-center justify-center border border-black/15 bg-white"><ChevronUp aria-hidden size={14} /></button>
                    <button type="button" aria-label="Pay this item later" onClick={() => move(idx, 1)} className="flex h-6 w-8 items-center justify-center border border-black/15 bg-white"><ChevronDown aria-hidden size={14} /></button>
                  </span>
                </div>
              ))}
              {paidCount > 0 && paidCount < allocation.length && (
                <button type="button" className="min-h-11 border-[1.5px] border-success bg-success-soft text-[13px] font-extrabold text-success">SHIP PAID ITEMS NOW ({paidCount})</button>
              )}
              <span className="text-xs leading-relaxed text-muted">If the link expires, money already paid becomes wallet credit. Contributors are refunded if you cancel. (Live updates are simulated in this preview.)</span>
            </div>
          )}
        </section>

        {/* Savings */}
        <section className="flex flex-col gap-2.5 bg-white p-3 md:rounded-md md:border md:border-line md:p-4">
          <div className="flex items-center justify-between">
            <span>
              <strong className="flex items-center">Coupon <InfoButton topic="coupons" className="-my-2" /></strong>
              <span className="text-xs text-muted">{best ? `${best.label} · best coupon applied` : "No coupon fits this cart yet"}{quote.couponNote ? ` · ${quote.couponNote}` : ""}</span>
            </span>
            <strong className="shrink-0 whitespace-nowrap pl-3 text-sale">{quote.coupon ? `−${naira(quote.coupon)}` : "—"}</strong>
          </div>
          <button type="button" role="switch" aria-checked={usePoints} onClick={() => setUsePoints(!usePoints)} className="flex min-h-10 items-center justify-between text-left">
            <span>
              <strong className="flex items-center">Use {(quote.pointsBalance ?? 0).toLocaleString("en-NG")} points</strong>
              <span className="text-xs text-muted">100 pts = ₦100 · up to 10% of the order</span>
            </span>
            <span className={cn("flex h-[26px] w-11 rounded-full p-[3px]", usePoints ? "justify-end bg-ink" : "justify-start bg-[#d4d4d4]")}>
              <span className="size-5 rounded-full bg-white" />
            </span>
          </button>
        </section>
      </div>

      {/* Summary */}
      <aside className="flex flex-col gap-1.5 bg-white p-3 lg:sticky lg:top-32 md:rounded-md md:border md:border-line md:p-5">
        <h2 className="hidden text-base font-extrabold md:block">Order summary</h2>
        <div className="flex justify-between"><span className="text-muted">Items</span><span>{naira(quote.subtotalList)}</span></div>
        {quote.priceSavings > 0 && <div className="flex justify-between"><span className="text-muted">Midnight / retailer savings</span><span className="text-sale">−{naira(quote.priceSavings)}</span></div>}
        <div className="flex justify-between"><span className="text-muted">Shipping to pickup station</span><span className="font-bold text-success">Free</span></div>
        <div className="flex justify-between"><span className="text-muted">Customs clearing</span><span className="font-bold text-success">Included</span></div>
        {quote.coupon > 0 && <div className="flex justify-between"><span className="text-muted">Coupon</span><span className="text-sale">−{naira(quote.coupon)}</span></div>}
        {quote.points > 0 && <div className="flex justify-between"><span className="text-muted">Points</span><span className="text-sale">−{naira(quote.points)}</span></div>}
        <div className="flex justify-between border-t border-line pt-1.5 text-base"><strong>Total</strong><strong>{naira(due)}</strong></div>
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-1 border-t border-line bg-white px-3 pt-2 pb-[max(14px,env(safe-area-inset-bottom))] md:static md:border-0 md:p-0 md:pt-2">
          {placeMsg && <p role="alert" className="text-center text-xs font-semibold text-sale">{placeMsg}</p>}
          {!placeMsg && !online && <p role="status" className="text-center text-xs font-semibold text-muted">You’re offline. We’ll confirm your total when you reconnect.</p>}
          {!placeMsg && online && quoteFailed && <p role="status" className="text-center text-xs font-semibold text-muted">Showing an estimate. We couldn’t confirm the final total yet; it updates when your connection settles.</p>}
          <button
            type="button"
            disabled={placing || selected.length === 0 || !online || !serverQuote}
            onClick={() =>
              startPlacing(async () => {
                setPlaceMsg(null);
                const call = await attempt(() => placeOrder({
                  items: selected.map((i) => ({ slug: i.slug, variantId: i.variantId, qty: i.qty })),
                  stationId: station, phone, mode, weeks, claimedCouponIds: claimed, usePoints,
                }));
                if (!call.ok) return setPlaceMsg(call.message);
                const r = call.value;
                if (!r.ok) return setPlaceMsg(r.message);
                try {
                  sessionStorage.setItem(`fc-track-${r.code}`, phone.replace(/\D/g, "").slice(-4));
                } catch {}
                for (const i of selected) remove(i.key);
                router.push(`/track?code=${r.code}`);
              })
            }
            className="min-h-[50px] bg-sale text-[15px] font-extrabold text-white disabled:opacity-60"
          >
            {placing ? "PLACING ORDER…" : !online ? "OFFLINE" : !serverQuote ? "CHECKING TOTAL…" : cta}
          </button>
          <span className="text-center text-[11px] text-muted">Paid via licensed processors · refund if it never reaches the station</span>
        </div>
      </aside>
    </div>
  );
}
