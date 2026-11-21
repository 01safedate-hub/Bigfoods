"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminCustomisation } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { call } from "@/lib/net";
import { decideCustomisation } from "../actions";

const STATUS: Record<AdminCustomisation["status"], string> = { reviewing: "Needs a price", quoted: "Waiting for customer payment", paid: "Paid", declined: "Asked for a new file" };

/** The customer's logo/artwork for one item: look at it, price it, confirm payment. */
export function CustomReview({ c }: { c: AdminCustomisation }) {
  const router = useRouter();
  const [amount, setAmount] = useState(c.quote_ngn ? String(c.quote_ngn) : "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const go = (action: "quote" | "paid" | "decline") => start(async () => {
    const r = await call(() => decideCustomisation(c.id, action, Number(amount.replace(/\D/g, "")), note));
    setMsg(r.message);
    if (r.ok) router.refresh();
  });
  const field = "min-h-9 rounded-md border border-[#D0D4DB] px-2.5 text-sm";
  return (
    <div className="flex flex-col gap-2 rounded-md border border-[#F0D9A8] bg-[#FFF9EC] p-2.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <strong>Customisation</strong>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{STATUS[c.status]}</span>
        {c.quote_ngn != null && <span className="text-xs">Price {naira(c.quote_ngn)}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.files.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element -- staff preview of customer artwork
          <a key={u} href={u} target="_blank" rel="noreferrer" title="Open full size"><img src={u} alt="Customer artwork" className="size-16 rounded border border-[#E3E5EA] bg-white object-contain" /></a>
        ))}
      </div>
      {c.note && <p className="text-xs">“{c.note}”</p>}
      {c.status !== "paid" && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs">₦<input aria-label="Customisation price in naira" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Price" className={`${field} w-28`} /></label>
          <input aria-label="Note to the customer" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to customer (optional)" className={`${field} min-w-40 flex-1`} />
          <button type="button" disabled={busy || !amount} onClick={() => go("quote")} className="min-h-9 rounded-md bg-ink px-3 text-xs font-bold text-white disabled:opacity-40">Send price</button>
          {c.status === "quoted" && <button type="button" disabled={busy} onClick={() => go("paid")} className="min-h-9 rounded-md border border-[#D0D4DB] bg-white px-3 text-xs font-bold">Transfer received</button>}
          <button type="button" disabled={busy} onClick={() => go("decline")} className="min-h-9 px-2 text-xs font-bold text-[#B42318]">Ask for new file</button>
        </div>
      )}
      {msg && <span className="text-xs text-[#5B6170]">{msg}</span>}
    </div>
  );
}
