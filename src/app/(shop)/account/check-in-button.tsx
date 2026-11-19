"use client";

import { CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { attempt } from "@/lib/net";
import { checkIn } from "../actions";

export function CheckInButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => start(async () => {
        const call = await attempt(checkIn);
        if (!call.ok) return setMsg(call.message);
        setMsg(call.value.message);
        if (call.value.ok) router.refresh();
      })}
      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-gold px-3 text-[13px] font-extrabold text-ink"
    >
      <CalendarCheck aria-hidden size={15} /> {msg ?? (busy ? "…" : "Check in · +5 points")}
    </button>
  );
}
