"use client";

import { useState, useTransition } from "react";
import { setRole } from "../actions";

export function RoleSelect({ id, role, help }: { id: string; role: string; help: Record<string, string> }) {
  const [value, setValue] = useState(role);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  return (
    <span className="flex flex-col items-end gap-1">
      <select
        value={value}
        disabled={busy}
        aria-label="Role"
        onChange={(e) => {
          const next = e.target.value;
          const before = value;
          setValue(next);
          start(async () => {
            const r = await setRole(id, next);
            setMsg({ ok: r.ok, text: r.message });
            if (!r.ok) setValue(before);
          });
        }}
        className="min-h-9 rounded-md border border-[#D0D4DB] bg-white px-2"
      >
        {Object.keys(help).map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
      </select>
      <span className={`text-xs ${msg && !msg.ok ? "text-[#B42318]" : "text-[#5B6170]"}`}>{msg?.text ?? help[value]}</span>
    </span>
  );
}
