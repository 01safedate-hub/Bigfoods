"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { naira } from "@/lib/format";
import { cancelOrder } from "../actions";
import { call } from "@/lib/net";

export function CancelButton({ id, refund, paid }: { id: string; refund: boolean; paid: number }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  if (!ask) return <button type="button" onClick={() => setAsk(true)} className="min-h-9 rounded-md border border-[#F0B4B4] px-3 font-bold text-[#B42318]">{refund ? "Refund (never arrived)" : "Cancel order"}</button>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason" aria-label="Reason" className="min-h-9 rounded-md border border-[#D0D4DB] px-2" />
      <button
        type="button"
        disabled={busy}
        onClick={() => start(async () => {
          const r = await call(() => cancelOrder(id, note));
          setMsg(r.message);
          if (r.ok) router.refresh();
        })}
        className="min-h-9 rounded-md bg-[#B42318] px-3 font-bold text-white"
      >
        {refund ? "Confirm refund" : "Confirm cancel"}{paid > 0 ? ` · return ${naira(paid)}` : ""}
      </button>
      <button type="button" onClick={() => setAsk(false)} className="min-h-9 px-2">Keep</button>
      {msg && <span role="status">{msg}</span>}
    </span>
  );
}
