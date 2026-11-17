"use client";

import { CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
        const r = await checkIn();
        setMsg(r.message);
        if (r.ok) router.refresh();
      })}
      className="flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-gold px-3 text-xs font-extrabold text-ink"
    >
      <CalendarCheck aria-hidden size={15} /> {msg ?? (busy ? "…" : "Check in · +5 points")}
    </button>
  );
}
