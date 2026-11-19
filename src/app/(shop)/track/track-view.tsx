"use client";

import { Check, Copy, PackageSearch } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useNow } from "@/hooks/use-now";
import { cn, naira } from "@/lib/format";
import { AUTO_DELIVER_DAYS, trackingStep } from "@/lib/orders/lifecycle";
import { planStatus } from "@/lib/payments/instalments";
import { type TrackedOrder, trackOrder } from "../actions";
import { attempt } from "@/lib/net";

const STEPS = ["Payment", "Ordering", "China warehouse", "On the way", "At your station"];
const day = (iso: string | number) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

export function TrackView() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [last4, setLast4] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const look = (c: string, l: string) =>
    start(async () => {
      const call = await attempt(() => trackOrder(c, l));
      const r = call.ok ? call.value : { ok: false as const, message: call.message };
      if (r.ok) {
        setOrder(r.order);
        setMsg(null);
      } else {
        setOrder(null);
        setMsg(r.message);
      }
    });

  // Straight after checkout we already know the phone digits for this order.
  useEffect(() => {
    const c = params.get("code");
    if (!c) return;
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(`fc-track-${c}`);
    } catch {}
    if (saved) look(c, saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = useNow(60_000);
  const step = order ? trackingStep(order.status) : null;
  const plan = order?.plan ? planStatus(order.plan.instalments.map((i) => ({ n: i.n, dueMs: Date.parse(i.due), amount: i.amount })), order.paid, now ?? 0) : null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 px-3 py-6 md:px-0">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold"><PackageSearch aria-hidden size={26} /> Track an order</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          look(code, last4);
        }}
        className="grid grid-cols-[1fr_110px] gap-2 sm:grid-cols-[1fr_140px_auto]"
      >
        <label className="flex flex-col gap-1 text-xs font-bold">
          Order code
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder="e.g. 737012B0" className="min-h-11 rounded-md border border-black/15 px-2.5 font-mono text-sm font-normal uppercase" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Phone, last 4
          <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="4412" className="min-h-11 rounded-md border border-black/15 px-2.5 text-sm font-normal" />
        </label>
        <button type="submit" disabled={busy} className="col-span-2 min-h-11 self-end rounded-md bg-ink px-5 text-sm font-extrabold text-white sm:col-span-1">{busy ? "…" : "TRACK"}</button>
      </form>
      {msg && <p role="alert" className="text-sale">{msg}</p>}

      {order && step && (
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="font-mono text-lg">#{order.code}</strong>
              <span className="text-xs text-muted">Placed {day(order.created_at)} · {order.station}</span>
            </div>
            <strong className={cn("text-base", step.step === 0 ? "text-sale" : "text-success")}>{step.label}</strong>
            {step.step > 0 && (
              <ol className="grid grid-cols-5 gap-1" aria-label={`Step ${step.step} of ${step.of}`}>
                {STEPS.map((s, i) => (
                  <li key={s} className="flex flex-col gap-1.5">
                    <span className={cn("h-1.5 rounded-full", i < step.step ? "bg-success" : "bg-[#E5E7EB]")} />
                    <span className={cn("text-[10px] leading-tight md:text-xs", i < step.step ? "font-bold" : "text-muted")}>{s}</span>
                  </li>
                ))}
              </ol>
            )}
            {order.shipped_at && order.status === "shipped" && (
              <p className="text-xs text-muted">Shipped {day(order.shipped_at)}. Marked delivered by {day(Date.parse(order.shipped_at) + AUTO_DELIVER_DAYS * 86_400_000)}. You’ll get an SMS with your pickup code.</p>
            )}
          </section>

          {plan && order.plan && (
            <section className="flex flex-col gap-2 rounded-lg border border-line bg-white p-4">
              <div className="flex justify-between"><strong>Pay small small</strong><span className="text-xs text-muted">{naira(order.paid)} of {naira(order.total)} paid</span></div>
              <ol>
                {order.plan.instalments.map((i) => {
                  const covered = order.plan!.instalments.filter((x) => x.n <= i.n).reduce((a, x) => a + x.amount, 0) <= order.paid;
                  return (
                    <li key={i.n} className="flex justify-between border-b border-dashed border-[#e2e2e2] py-1.5 last:border-0">
                      <span className="flex items-center gap-1.5">{covered && <Check aria-hidden size={14} className="text-success" />}{day(i.due)} · payment {i.n}</span>
                      <strong className={covered ? "text-success" : ""}>{naira(i.amount)}</strong>
                    </li>
                  );
                })}
              </ol>
              {plan.state === "late" && <p className="font-semibold text-sale">A payment is overdue. Pay {naira(plan.overdue)} to keep your plan. It’s cancelled on {day(plan.cancelAtMs!)} if unpaid.</p>}
            </section>
          )}

          {order.link && (
            <section className="flex flex-col gap-2 rounded-lg bg-group-soft p-4">
              <strong>Group pay link</strong>
              <span className="text-xs text-muted">Open until {day(order.link.expires_at)} · {naira(order.paid)} of {naira(order.total)} raised</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`https://fastchina.shop/c/${order.link!.code}`).catch(() => {});
                  setCopied(true);
                }}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-ink bg-white font-mono text-sm font-bold"
              >
                <Copy aria-hidden size={14} /> fastchina.shop/c/{order.link.code} {copied && "· copied"}
              </button>
            </section>
          )}

          <section className="flex flex-col rounded-lg border border-line bg-white">
            {order.items.map((i, k) => (
              <div key={k} className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-line p-3 first:border-0", i.removed && "opacity-50")}>
                <span className="min-w-0">
                  <strong className="block truncate text-[13px] font-semibold">{i.title}</strong>
                  <span className="text-xs text-muted">{[i.variant, `×${i.qty}`, i.ship === "sea" ? "Sea" : "Air"].filter(Boolean).join(" · ")}{i.removed ? " · removed, refunded" : order.pay_mode === "group" && i.funded ? " · paid" : ""}</span>
                </span>
                <strong className="shrink-0">{naira(i.unit * i.qty)}</strong>
                {i.photos && i.photos.length > 0 && (
                  <span className="flex basis-full gap-1.5 overflow-x-auto pt-1" aria-label="Photos from our China warehouse">
                    {i.photos.map((u) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer" className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface">
                        <Image src={u} alt="Your item at our China warehouse" fill sizes="64px" className="object-cover" />
                      </a>
                    ))}
                    <span className="self-center text-[11px] text-success">Photo checked in China</span>
                  </span>
                )}
              </div>
            ))}
            <div className="flex justify-between border-t border-line p-3"><strong>Total</strong><strong>{naira(order.total)}</strong></div>
          </section>
        </div>
      )}
      <p className="text-xs text-muted">Signed in? Your orders are also under <Link href="/account" className="underline">My account</Link>.</p>
    </div>
  );
}
