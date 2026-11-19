"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/format";
import { call } from "@/lib/net";
import { EXPENSE_LABEL } from "../money";
import { addExpense, removeExpense } from "../stock-actions";

const field = "min-h-10 rounded-md border border-[#D0D4DB] bg-white px-2.5 text-sm text-ink";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

/** Hand-entered spending. Purchases, dispatches and returns add their own costs automatically. */
export function ExpenseForm() {
  const [category, setCategory] = useState("packaging");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const save = () => start(async () => {
    const r = await call(() => addExpense({ category, amount, date, note }));
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) { setAmount(0); setNote(""); }
  });
  return (
    <form className="flex flex-col gap-2 rounded-lg border-2 border-ink bg-white p-3.5" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <strong>Add an expense</strong>
      <span className="text-xs text-[#5B6170]">Rent, salaries, ads, packaging, bank charges… Purchase fees, Jumia costs and return fees are added for you.</span>
      <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
        {Object.entries(EXPENSE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <div className="flex gap-2">
        <input aria-label="Amount in naira" inputMode="numeric" placeholder="₦ amount" value={amount || ""} onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, ""))) || 0))} className={cn(field, "min-w-0 flex-1")} />
        <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </div>
      <input aria-label="Note" placeholder="What was it for?" value={note} onChange={(e) => setNote(e.target.value)} className={field} />
      <div className="flex items-center justify-end gap-3">
        {msg && <span role="status" className={cn("mr-auto text-xs", msg.ok ? "font-semibold text-success" : "text-sale")}>{msg.text}</span>}
        <button type="submit" disabled={busy || !amount} className="min-h-10 rounded-md bg-ink px-4 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Add"}</button>
      </div>
    </form>
  );
}

export function RemoveExpense({ id }: { id: string }) {
  const [busy, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <button type="button" disabled={busy} title={err ?? "Remove"} aria-label="Remove expense"
      onClick={() => { if (confirm("Remove this expense?")) start(async () => { const r = await call(() => removeExpense(id)); if (!r.ok) setErr(r.message); }); }}
      className={cn("p-2", err ? "text-sale" : "text-[#5B6170]")}>
      <Trash2 size={15} />
    </button>
  );
}
