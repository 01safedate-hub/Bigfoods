"use client";

import { useState, useTransition } from "react";
import { setProductCustomisable, setProductStatus } from "./actions";

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

/** Customisable on/off: shows the "add your logo" option to customers. */
export function CustomisableToggle({ slug, on }: { slug: string; on: boolean }) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-bold">
      <input
        type="checkbox"
        checked={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setValue(next);
          start(async () => {
            const r = await setProductCustomisable(slug, next).catch(() => ({ ok: false as const, message: "" }));
            if (!r.ok) setValue(!next);
          });
        }}
        className="size-4 accent-[#8A5A00]"
      />
      Customisable
    </label>
  );
}
