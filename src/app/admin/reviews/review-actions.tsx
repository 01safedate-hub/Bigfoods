"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { call } from "@/lib/net";
import { moderateReview } from "../actions";

export function ReviewActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const go = (to: "published" | "hidden") => start(async () => {
    const r = await call(() => moderateReview(id, to));
    setMsg(r.message);
    if (r.ok) router.refresh();
  });
  return (
    <div className="flex items-center gap-2">
      {status !== "published" && <button type="button" disabled={busy} onClick={() => go("published")} className="min-h-9 rounded-md bg-ink px-4 text-sm font-bold text-white disabled:opacity-50">Publish</button>}
      {status !== "hidden" && <button type="button" disabled={busy} onClick={() => go("hidden")} className="min-h-9 rounded-md border border-[#D0D4DB] px-4 text-sm font-bold disabled:opacity-50">Hide</button>}
      {msg && <span className="text-xs text-[#5B6170]">{msg}</span>}
    </div>
  );
}
