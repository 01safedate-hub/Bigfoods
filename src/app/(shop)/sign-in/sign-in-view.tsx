"use client";

import { Lock, Mail, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BoltMark } from "@/components/shop/header";
import { authAvailable, browserDb } from "@/lib/supabase/browser";
import { cn } from "@/lib/format";

type Via = "email" | "phone";

/** Nigerian numbers to E.164: 0803… → +234803… */
export const toE164 = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) return `+${d}`;
  if (d.startsWith("0")) return `+234${d.slice(1)}`;
  return `+${d}`;
};

/** Passwordless sign-in: we send a 6-digit code by email or SMS. New customers get an account automatically. */
export function SignInView() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const [via, setVia] = useState<Via>("email");
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const target = via === "email" ? { email: id.trim().toLowerCase() } : { phone: toE164(id) };
  const valid = via === "email" ? /^\S+@\S+\.\S+$/.test(id.trim()) : id.replace(/\D/g, "").length >= 10;

  async function send() {
    if (!authAvailable) return setMsg({ ok: false, text: "Sign-in turns on when the database is connected." });
    setBusy(true);
    const { error } = await browserDb().auth.signInWithOtp({ ...target, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setSent(true);
    setMsg({ ok: true, text: via === "email" ? "We emailed you a 6-digit code." : "We texted you a 6-digit code." });
  }

  async function verify() {
    setBusy(true);
    const { error } = await browserDb().auth.verifyOtp(via === "email" ? { email: target.email!, token: code.trim(), type: "email" } : { phone: target.phone!, token: code.trim(), type: "sms" });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "That code didn’t work. Check it or send a new one." });
    router.replace(safeNext);
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <BoltMark size={44} />
        <h1 className="text-2xl font-extrabold">Sign in or join</h1>
        <p className="text-muted">No password. We’ll send you a one-time code.</p>
      </div>

      <div role="tablist" aria-label="Sign in with" className="grid grid-cols-2 rounded-lg bg-surface p-1">
        {([["email", "Email", Mail], ["phone", "Phone", Smartphone]] as const).map(([k, label, Icon]) => (
          <button key={k} role="tab" type="button" aria-selected={via === k} onClick={() => { setVia(k); setSent(false); setCode(""); setMsg(null); }}
            className={cn("flex min-h-10 items-center justify-center gap-1.5 rounded-md text-sm font-bold", via === k ? "bg-white shadow-sm" : "text-muted")}>
            <Icon aria-hidden size={16} /> {label}
          </button>
        ))}
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sent) void send();
          else void verify();
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-bold">
          {via === "email" ? "Email address" : "Phone number"}
          <input
            type={via === "email" ? "email" : "tel"}
            autoComplete={via === "email" ? "email" : "tel"}
            inputMode={via === "email" ? "email" : "tel"}
            value={id}
            disabled={sent}
            onChange={(e) => setId(e.target.value)}
            placeholder={via === "email" ? "you@example.com" : "0803 000 0000"}
            className="min-h-12 rounded-md border border-black/15 px-3 text-base font-normal disabled:bg-surface"
          />
        </label>
        {sent && (
          <label className="flex flex-col gap-1 text-sm font-bold">
            6-digit code
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus
              className="min-h-12 rounded-md border border-black/15 px-3 text-center font-mono text-xl tracking-[0.5em]" />
          </label>
        )}
        {msg && <p role="status" className={msg.ok ? "text-success" : "text-sale"}>{msg.text}</p>}
        <button type="submit" disabled={busy || (!sent ? !valid : code.length !== 6)} className="min-h-12 rounded-md bg-ink text-sm font-extrabold text-white disabled:opacity-40">
          {busy ? "…" : sent ? "SIGN IN" : "SEND CODE"}
        </button>
        {sent && (
          <button type="button" onClick={() => { setSent(false); setCode(""); setMsg(null); }} className="min-h-10 text-sm text-muted underline">
            Use a different {via === "email" ? "email" : "number"}
          </button>
        )}
      </form>
      <p className="flex items-start gap-2 rounded-md bg-surface p-3 text-xs leading-relaxed text-muted">
        <Lock aria-hidden size={14} className="mt-0.5 shrink-0" /> We only use your number for order updates and pickup codes. We never share it with sellers or contributors.
      </p>
    </div>
  );
}
