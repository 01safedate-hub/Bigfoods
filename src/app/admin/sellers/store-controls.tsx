"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminStore } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { call } from "@/lib/net";
import { markPayoutPaid, setDomainVerified, setStorePlan, setStoreStatus } from "../actions";

export function StoreControls({ store }: { store: AdminStore }) {
  const router = useRouter();
  const [plan, setPlan] = useState(store.plan);
  const [months, setMonths] = useState(1);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await call(fn);
      setMsg(r.message);
      if (r.ok) router.refresh();
    });
  const btn = "min-h-9 rounded-md border border-[#D0D4DB] px-3 text-sm font-bold disabled:opacity-40";
  return (
    <div className="flex flex-col gap-3 border-t border-[#EEF0F3] p-3.5 text-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[#5B6170]">
        <span>Owner: {store.owner ?? "—"}</span>
        <span>Opened {new Date(store.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        {store.plan_renews_at && <span>Renews {new Date(store.plan_renews_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
        <a href={`/s/${store.slug}`} target="_blank" rel="noreferrer" className="font-bold text-[#2563EB] underline">Open store</a>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`plan-${store.id}`}>Plan</label>
        <select id={`plan-${store.id}`} value={plan} onChange={(e) => setPlan(e.target.value)} className="min-h-9 rounded-md border border-[#D0D4DB] px-2">
          <option value="free">Free</option><option value="pro">Pro · ₦15,000/mo</option><option value="elite">Elite · ₦45,000/mo</option>
        </select>
        {plan !== "free" && (
          <select aria-label="Months" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="min-h-9 rounded-md border border-[#D0D4DB] px-2">
            {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>)}
          </select>
        )}
        <button type="button" disabled={busy} className={btn} onClick={() => run(() => setStorePlan(store.id, plan, months))}>Set plan</button>
        {store.custom_domain && (
          <button type="button" disabled={busy} className={btn} onClick={() => run(() => setDomainVerified(store.id, !store.domain_verified))}>
            {store.domain_verified ? `Switch off ${store.custom_domain}` : `Mark ${store.custom_domain} live`}
          </button>
        )}
        <button type="button" disabled={busy} className={`${btn} ${store.status === "suspended" ? "" : "border-[#F0B4B4] text-[#B42318]"}`}
          onClick={() => run(() => setStoreStatus(store.id, store.status === "suspended" ? "active" : "suspended"))}>
          {store.status === "suspended" ? "Reopen store" : "Suspend store"}
        </button>
      </div>
      {store.payouts.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-md bg-[#FFF7E6] p-2.5">
          <span className="flex-1"><strong>{naira(p.amount_ngn)}</strong> to {p.bank_snapshot.name} · {p.bank_snapshot.bank} {p.bank_snapshot.account} · {p.items} items</span>
          <input value={refs[p.id] ?? ""} onChange={(e) => setRefs({ ...refs, [p.id]: e.target.value })} placeholder="Transfer reference" aria-label="Transfer reference" className="min-h-9 rounded-md border border-[#D0D4DB] bg-white px-2" />
          <button type="button" disabled={busy || !refs[p.id]} className={btn} onClick={() => run(() => markPayoutPaid(p.id, refs[p.id]))}>Mark paid</button>
        </div>
      ))}
      {msg && <p role="status" className="text-[#5B6170]">{msg}</p>}
    </div>
  );
}
