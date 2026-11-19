"use client";

import { useState, useTransition } from "react";
import { setProductStatus } from "./actions";

const LABEL: Record<string, string> = { active: "Live", draft: "Draft", hidden: "Hidden", sold_out: "Sold out" };

export function StatusSelect({ slug, status }: { slug: string; status: string }) {
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-2">
      {msg && <span role="alert" className="text-xs text-sale">{msg}</span>}
      <select
        aria-label="Status"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          setMsg("");
          start(async () => {
            const r = await setProductStatus(slug, next).catch(() => ({ ok: false as const, message: "Couldn’t save. Check your connection." }));
            if (!r.ok) { setValue(prev); setMsg(r.message); }
          });
        }}
        className={`min-h-9 rounded-md border px-2 text-xs font-bold ${value === "active" ? "border-success bg-success-soft text-success" : "border-[#D0D4DB] bg-white"}`}
      >
        {Object.entries(LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </span>
  );
}
