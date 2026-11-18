"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/format";
import { call } from "@/lib/net";
import { saveBank } from "../actions";
import { btn } from "../_ui/ui";

const BANKS = ["Access Bank", "Ecobank", "Fidelity Bank", "First Bank", "FCMB", "GTBank", "Kuda", "Moniepoint", "Opay", "PalmPay", "Polaris Bank", "Stanbic IBTC", "Sterling Bank", "UBA", "Union Bank", "Wema Bank", "Zenith Bank"];

export function BankForm({ initial }: { initial: { bank_name: string | null; account_number: string | null; account_name: string | null } }) {
  const [f, setF] = useState({ bank_name: initial.bank_name ?? "", account_number: initial.account_number ?? "", account_name: initial.account_name ?? "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await call(() => saveBank(f));
          setMsg({ ok: r.ok, text: r.message });
        });
      }}
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Bank
        <select value={f.bank_name} onChange={(e) => setF({ ...f, bank_name: e.target.value })} className={btn.input}>
          <option value="">Choose your bank</option>
          {BANKS.map((b) => <option key={b}>{b}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Account number
        <input value={f.account_number} onChange={(e) => setF({ ...f, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" autoComplete="off" placeholder="10 digits" className={cn(btn.input, "font-mono tracking-wider")} />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Name on the account
        <input value={f.account_name} onChange={(e) => setF({ ...f, account_name: e.target.value })} autoComplete="name" className={btn.input} />
      </label>
      {msg && <p role="status" className={cn("text-[13px] font-semibold", msg.ok ? "text-[#3DDC84]" : "text-[#FF8A8A]")}>{msg.text}</p>}
      <button type="submit" disabled={busy} className={btn.primary}>Save account</button>
      <p className="text-[12px] text-[#6B6B73]">Payouts only go to an account in your name. We check the name matches before the first payout.</p>
    </form>
  );
}
