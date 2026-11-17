"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductTile } from "@/components/shop/product-card";
import { InfoButton } from "@/components/ui/info-button";
import { Progress } from "@/components/ui/progress";
import { useNow } from "@/hooks/use-now";
import type { Product } from "@/lib/catalog/types";
import { allocate } from "@/lib/group-pay";
import { cn, naira } from "@/lib/format";

interface Gift {
  name: string;
  amount: number;
  at: number;
}

const COLORS = ["#4F46E5", "#0B6B3A", "#C8102E", "#7A5C17", "#0B2545", "#B4235A"];

/** Demo order behind link TOLU-7K2X. In production: `group_pay_links` + Supabase Realtime. */
export function ContributeView({ code, items: ITEMS }: { code: string; items: Product[] }) {
  const now = useNow(30_000);
  const [feed, setFeed] = useState<Gift[]>([]);
  const [amount, setAmount] = useState(5_000);
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const seed: Gift[] = [
      { name: "Chidi O.", amount: 20_000, at: start - 600_000 },
      { name: "Anonymous", amount: 15_000, at: start - 1_500_000 },
      { name: "Mummy", amount: 50_000, at: start - 3_600_000 },
      { name: "Tolu A.", amount: 50_000, at: start - 7_200_000 },
    ];
    const live: [string, number][] = [["Bisi K.", 5_000], ["Anonymous", 10_000], ["Emeka N.", 8_000], ["Funke A.", 3_000], ["Uncle Seyi", 25_000]];
    let k = 0;
    const first = setTimeout(() => setFeed(seed), 0);
    const id = setInterval(() => {
      if (k >= live.length) return;
      const [n, a] = live[k++];
      setFeed((f) => [{ name: n, amount: a, at: Date.now() }, ...f]);
    }, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const prices = ITEMS.map((p) => p.prices.list);
  const total = prices.reduce((a, b) => a + b, 0);
  const raised = Math.min(total, feed.reduce((a, b) => a + b.amount, 0));
  const gotByItem = allocate(prices, raised);
  const ago = (at: number) => {
    if (now === null) return "";
    const m = Math.max(0, Math.floor((now - at) / 60_000));
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)}h ago`;
  };

  return (
    <div className="flex flex-col gap-2.5 bg-group-soft p-2.5 pb-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-start md:gap-6 md:bg-transparent md:p-0 md:pt-6">
      <div className="flex flex-col gap-2.5">
        <section className="flex flex-col gap-3 rounded-xl bg-white p-3.5 md:border md:border-line md:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-group text-base font-extrabold text-white">TA</span>
            <span>
              <h1 className="text-[15px] font-bold md:text-xl">Tolu needs help with her order</h1>
              <span className="text-muted">“Christmas phone upgrade. Anything helps, thank you!” · Link {code}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between">
              <span>
                <strong className="text-2xl tabular-nums md:text-3xl">{naira(raised)}</strong> <span className="text-muted">of {naira(total)}</span>
              </span>
              <span className="font-extrabold text-group">● LIVE</span>
            </span>
            <Progress value={(raised / total) * 100} className="h-3 bg-[#E6E4F5]" barClass="bg-group" label="Amount raised" />
            <span className="text-muted">
              {Math.round((raised / total) * 100)}% · {feed.length} people · {naira(total - raised)} to go
            </span>
          </div>
          <ul className="flex flex-col gap-2 border-t border-[#F0EFFA] pt-2.5">
            {ITEMS.map((p, i) => {
              const got = gotByItem[i];
              const done = got >= prices[i];
              return (
                <li key={p.slug} className="flex items-center gap-2">
                  <ProductTile tint={p.tint} icon={p.icon} name={p.name} image={p.images[0]} sizes="40px" className="h-[42px] w-[34px] shrink-0" iconSize={18} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex justify-between gap-1.5"><span className="truncate">{p.name}</span><strong>{naira(prices[i])}</strong></span>
                    <Progress value={(got / prices[i]) * 100} className="h-1" barClass={done ? "bg-[#16A34A]" : "bg-group"} label={`${p.name} paid`} />
                    <span className={cn("text-[11px] font-bold", done ? "text-success" : "text-muted")}>{done ? "Paid · shipping now" : `${Math.round((got / prices[i]) * 100)}% paid`}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-live="polite" className="flex flex-col rounded-xl bg-white p-3.5 md:border md:border-line">
          <h2 className="mb-1 text-sm font-bold">Recent contributions</h2>
          {feed.slice(0, 6).map((f) => (
            <div key={`${f.name}-${f.at}`} className="flex items-center gap-2 border-b border-[#f3f3f3] py-1.5 last:border-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: f.name === "Anonymous" ? "#9A9A9A" : COLORS[f.name.length % COLORS.length] }}>
                {f.name === "Anonymous" ? "?" : f.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="flex-1">
                <strong className="block">{f.name}</strong>
                <span className="text-muted">{ago(f.at)}</span>
              </span>
              <strong className="text-success">{naira(f.amount)}</strong>
            </div>
          ))}
        </section>
      </div>

      <form
        className="flex flex-col gap-2.5 rounded-xl bg-white p-3.5 lg:sticky lg:top-32 md:border md:border-line md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!amount) return;
          setFeed((f) => [{ name: anon || !name.trim() ? "Anonymous" : name.trim(), amount, at: Date.now() }, ...f]);
          setThanks(true);
        }}
      >
        <span className="flex items-center">
          <h2 className="text-[15px] font-bold">Chip in</h2>
          <InfoButton topic="group" />
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[2_000, 5_000, 10_000, 20_000, 50_000, total - raised].map((v, i) => (
            <button key={i} type="button" aria-pressed={amount === v} onClick={() => setAmount(Math.max(0, v))} className={cn("min-h-[42px] border-[1.5px] px-1 text-[13px] font-bold", amount === v ? "border-group bg-[#EEF0FF]" : "border-black/15")}>
              {i === 5 ? "Clear it" : naira(v)}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Or enter an amount (₦)
          <input type="number" min={500} step={500} value={amount || ""} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} className="min-h-11 border border-black/15 px-2.5 text-base font-bold" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown to Tolu" className="min-h-11 border border-black/15 px-2.5 text-sm font-normal" />
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input type="checkbox" checked={anon} onChange={() => setAnon(!anon)} className="size-[18px]" />
          Hide my name from others
        </label>
        <button type="submit" className="min-h-[50px] bg-group text-[15px] font-extrabold text-white">CONTRIBUTE {naira(amount)}</button>
        {thanks && <span className="bg-success-soft p-2.5 font-bold text-success">Thank you! Tolu has been notified.</span>}
        <span className="text-xs leading-relaxed text-muted">Your money goes straight to this order, never to Tolu’s account. If the order is cancelled you’re refunded to your original payment method.</span>
        <Link href="/" className="text-center text-muted">Shop FastChina · free shipping on everything ›</Link>
      </form>
    </div>
  );
}
