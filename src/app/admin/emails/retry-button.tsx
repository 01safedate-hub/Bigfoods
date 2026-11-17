"use client";

import { useState, useTransition } from "react";
import { retryEmail } from "../actions";

export function RetryButton({ id }: { id: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <button type="button" disabled={busy || !!msg} onClick={() => start(async () => setMsg((await retryEmail(id)).message))} className="min-h-8 rounded-md border border-[#D0D4DB] px-2.5 text-xs font-bold">
      {msg ?? "Retry"}
    </button>
  );
}
