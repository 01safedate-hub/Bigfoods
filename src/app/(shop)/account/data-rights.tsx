"use client";

import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { attempt, call } from "@/lib/net";
import { deleteMyAccount, exportMyData } from "../actions";

/** Download my data and Delete my account (Nigeria Data Protection Act 2023). */
export function DataRights() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, start] = useTransition();
  return (
    <details className="text-xs">
      <summary className="cursor-pointer py-1 font-bold">Your data and privacy</summary>
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => start(async () => {
            const r = await attempt(exportMyData);
            if (!r.ok) return setMsg({ ok: false, text: r.message });
            if (!r.value.ok) return setMsg({ ok: false, text: r.value.message });
            const url = URL.createObjectURL(new Blob([r.value.json], { type: "application/json" }));
            const a = Object.assign(document.createElement("a"), { href: url, download: "fastchina-my-data.json" });
            a.click();
            URL.revokeObjectURL(url);
            setMsg({ ok: true, text: "Downloaded." });
          })}
          className="flex min-h-10 items-center gap-2 rounded-md border border-black/20 px-3 font-bold"
        >
          <Download aria-hidden size={14} /> Download my data
        </button>
        {!asking ? (
          <button type="button" onClick={() => setAsking(true)} className="flex min-h-10 items-center gap-2 rounded-md border border-[#F0B4B4] px-3 font-bold text-sale">
            <Trash2 aria-hidden size={14} /> Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-md bg-sale-soft p-3">
            <p>This removes your sign-in, wallet, points, saved items and notifications for good. Wallet money can’t be recovered. Past orders are kept without your details because the law requires sales records.</p>
            <label className="flex flex-col gap-1 font-bold">
              Type DELETE to confirm
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="min-h-10 rounded-md border border-black/20 bg-white px-2 font-normal" />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || typed !== "DELETE"}
                onClick={() => start(async () => {
                  const r = await call(() => deleteMyAccount(typed));
                  setMsg({ ok: r.ok, text: r.message });
                  if (r.ok) {
                    router.replace("/");
                    router.refresh();
                  }
                })}
                className="min-h-10 rounded-md bg-sale px-3 font-bold text-white disabled:opacity-40"
              >
                Delete for good
              </button>
              <button type="button" onClick={() => setAsking(false)} className="min-h-10 px-3">Keep my account</button>
            </div>
          </div>
        )}
        {msg && <p role="status" className={msg.ok ? "text-success" : "text-sale"}>{msg.text}</p>}
      </div>
    </details>
  );
}
