"use client";

import { useState, useTransition } from "react";
import { call } from "@/lib/net";
import { requestUpgrade } from "../actions";
import { btn } from "../_ui/ui";

export function UpgradeButton({ plan, label, featured }: { plan: "pro" | "elite"; label: string; featured?: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={busy} className={featured ? btn.primary : btn.ghost} onClick={() => start(async () => setMsg((await call(() => requestUpgrade(plan))).message))}>{label}</button>
      {msg && <p role="status" className="text-[12px] text-[#A1A1AA]">{msg}</p>}
    </div>
  );
}
