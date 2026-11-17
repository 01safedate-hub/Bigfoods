"use client";

import { Check, Moon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CouponRow, FlashSale } from "@/components/shop/promos";
import { Countdown, MidnightLabel } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { useNow } from "@/hooks/use-now";
import { usePersistentState } from "@/hooks/use-persistent-state";
import type { Product } from "@/lib/catalog/types";
import { EVENTS, eventDates, eventStatus } from "@/lib/events";
import { cn } from "@/lib/format";
import { dhm, nextDraw } from "@/lib/time";

const STREAK_PTS = [5, 5, 5, 10, 5, 5, 30];

export function DealsView({ flash }: { flash: Product[] }) {
  const now = useNow();
  const [points, setPoints] = usePersistentState("fc-points", 1240);
  const [checked, setChecked] = useState(false);
  const [reminders, setReminders] = usePersistentState<string[]>("fc-reminders", ["Black Friday"]);
  const [midRemind, setMidRemind] = usePersistentState("fc-mid-remind", false);
  const streak = 3;
  const done = streak + (checked ? 1 : 0);
  const draw = now === null ? null : dhm(nextDraw(now));

  return (
    <div className="flex flex-col gap-2.5 bg-surface p-2.5 pb-8 md:grid md:grid-cols-2 md:gap-4 md:bg-transparent md:p-0 md:pt-6 lg:grid-cols-3">
      <h1 className="flex items-center justify-between rounded-lg bg-white p-3.5 text-lg font-extrabold md:col-span-2 md:p-0 lg:col-span-3 md:text-2xl">
        Deals &amp; Rewards
        <span className="rounded-full bg-[#FFF6DA] px-2.5 py-1.5 text-xs font-extrabold text-gold-ink">{points.toLocaleString("en-NG")} pts</span>
      </h1>

      <section className="flex flex-col gap-2.5 rounded-lg bg-white p-3.5 md:border md:border-line">
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <h2 className="text-[15px] font-bold">Daily check-in</h2>
            <InfoButton topic="points" />
          </span>
          <span className="text-xs text-muted">100 pts = ₦100 off</span>
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {STREAK_PTS.map((p, i) => (
            <li
              key={i}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md py-2 text-[10px]",
                i < done ? "bg-[#FFF6DA] text-gold-ink" : i === streak ? "border-[1.5px] border-sale text-sale" : "bg-surface text-subtle",
              )}
            >
              <strong className="text-xs">+{p}</strong>Day {i + 1}
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={checked}
          onClick={() => {
            setChecked(true);
            setPoints(points + STREAK_PTS[streak]);
          }}
          className={cn("min-h-11 text-[13px] font-extrabold", checked ? "bg-surface text-muted" : "bg-ink text-white")}
        >
          {checked ? "Checked in today ✓ · come back tomorrow" : `CHECK IN · +${STREAK_PTS[streak]} POINTS`}
        </button>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[["Verify email", "+100"], ["Review with photo", "+20"], ["Every ₦100 spent", "+1"], ["Friend’s 1st order", "+500"]].map(([k, v]) => (
            <span key={k} className="flex justify-between rounded-md bg-surface p-2">
              {k} <strong>{v}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-lg bg-white p-3.5 md:border md:border-line">
        <span className="flex items-center">
          <h2 className="text-[15px] font-bold">Coupon center</h2>
          <InfoButton topic="coupons" />
        </span>
        <CouponRow />
      </section>

      <section className="flex flex-col gap-2 rounded-lg bg-night p-3.5 text-white md:p-5">
        <div className="flex items-center justify-between text-[11px] font-extrabold tracking-[0.14em] text-night-soft">
          <span className="flex items-center gap-1.5">
            <Moon aria-hidden size={14} /> MIDNIGHT DROP · 12AM–4AM <InfoButton topic="midnight" />
          </span>
          <span className="rounded-sm bg-night-soft px-1.5 py-0.5 text-night">
            <MidnightLabel live="LIVE NOW" idle="STARTS IN" />
          </span>
        </div>
        <strong className="text-lg leading-snug">Every night we cut our profit by 20% on everything</strong>
        <span className="text-xs text-[#C7C9E0]">Prices drop by themselves. No code needed. Gadgets included.</span>
        <div className="flex items-center justify-between">
          <Countdown target="midnight" className="text-2xl font-extrabold" />
          <button
            type="button"
            aria-pressed={midRemind}
            onClick={() => setMidRemind(!midRemind)}
            className={cn("min-h-10 rounded-full px-3.5 text-xs font-extrabold text-night", midRemind ? "bg-[#7EE2A8]" : "bg-white")}
          >
            {midRemind ? "Reminder set" : "Remind me"}
          </button>
        </div>
      </section>

      <section id="clearout" className="flex flex-col gap-2.5 rounded-lg border-[1.5px] border-ink bg-white p-3.5">
        <span className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold tracking-[0.14em] text-sale">CART CLEAR-OUT · FRIDAY 8PM</span>
          <InfoButton topic="clearout" />
        </span>
        <strong className="text-[17px] leading-snug">5 random carts paid for. Up to ₦50,000 each.</strong>
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          {(["d", "h", "m"] as const).map((k) => (
            <span key={k} className="rounded-md bg-surface px-1 py-2.5">
              <strong className="block text-xl tabular-nums">{draw ? draw[k] : "--"}</strong>
              {k === "d" ? "days" : k === "h" ? "hours" : "mins"}
            </span>
          ))}
        </div>
        <Link href="/cart" className="flex items-center justify-between rounded-md bg-success-soft px-3 py-2.5">
          <span>
            <strong className="block text-success">Your cart is entered</strong>
            <span className="text-xs text-muted">Keep ₦20,000+ in your cart until the draw</span>
          </span>
          <Check aria-hidden size={18} className="text-success" />
        </Link>
        <span className="text-xs leading-relaxed text-muted">Free to enter. Winners are picked at random on a live stream and told by SMS.</span>
      </section>

      <section className="flex flex-col rounded-lg bg-white p-3.5 md:border md:border-line">
        <h2 className="mb-1.5 text-[15px] font-bold">Event calendar</h2>
        {EVENTS.map((e) => {
          const st = now === null ? null : eventStatus(now, e.start, e.end);
          const on = reminders.includes(e.name);
          return (
            <div key={e.name} className="flex items-center gap-2.5 border-b border-[#f2f2f2] py-2 last:border-0">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="text-[13px]">{e.name}</strong>
                <span className="text-xs text-muted">
                  {eventDates(e.start, e.end)}
                  {st ? ` · ${st.label}` : ""}
                </span>
              </span>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setReminders(on ? reminders.filter((r) => r !== e.name) : [...reminders, e.name])}
                className={cn("min-h-9 rounded border px-2.5 text-xs font-bold", on ? "border-success bg-success-soft text-success" : "border-ink")}
              >
                {on ? "Reminder on" : "Remind me"}
              </button>
            </div>
          );
        })}
      </section>

      <div className="md:col-span-2 lg:col-span-3">
        <FlashSale products={flash} />
      </div>
      <p className="px-1 text-xs leading-relaxed text-muted md:col-span-2 lg:col-span-3">
        One coupon per order. Coupons don’t apply to retailer (10+) prices. Points can pay up to 10% of an order.
      </p>
    </div>
  );
}
