"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signIn, signUp } from "@/app/(shop)/auth-actions";
import { authAvailable, browserDb } from "@/lib/supabase/browser";
import { cn } from "@/lib/format";

export type AuthMode = "signup" | "signin" | "code";

const input = "min-h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[16px] outline-none focus:border-ink";
const offline = () => typeof navigator !== "undefined" && !navigator.onLine;

/**
 * Create an account (name, email, password; no email verification), sign in with a password,
 * or sign in with a one-time email code (also the way back in if you forget your password).
 */
export function AuthForm({ initial = "signup", stationId, onDone }: { initial?: AuthMode; stationId?: string | null; onDone: () => void }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", code: "" });
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (offline()) return setMsg({ ok: false, text: "You’re offline. Connect and try again." });
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = await signUp({ name: f.name, email: f.email, password: f.password, phone: f.phone, stationId });
        if (!r.ok) return setMsg({ ok: false, text: r.message });
        return onDone();
      }
      if (mode === "signin") {
        const r = await signIn({ email: f.email, password: f.password });
        if (!r.ok) return setMsg({ ok: false, text: r.message });
        return onDone();
      }
      if (!authAvailable) return setMsg({ ok: false, text: "Sign-in turns on when the database is connected." });
      const email = f.email.trim().toLowerCase();
      if (!sent) {
        const { error } = await browserDb().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (error) return setMsg({ ok: false, text: /not found|signups/i.test(error.message) ? "No account with that email. Create one instead." : "Couldn’t send the code. Try again in a minute." });
        setSent(true);
        return setMsg({ ok: true, text: "We emailed you a 6-digit code." });
      }
      const { error } = await browserDb().auth.verifyOtp({ email, token: f.code.trim(), type: "email" });
      if (error) return setMsg({ ok: false, text: "That code didn’t work. Check it or send a new one." });
      onDone();
    } catch {
      setMsg({ ok: false, text: "Something went wrong. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  const switchTo = (m: AuthMode) => { setMode(m); setMsg(null); setSent(false); };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {mode !== "code" && (
        <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-full bg-surface p-1">
          {(["signup", "signin"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchTo(m)} className={cn("min-h-10 rounded-full text-[14px] font-bold", mode === m ? "bg-white shadow-sm" : "text-muted")}>
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>
      )}
      {mode === "signup" && (
        <label className="flex flex-col gap-1 text-[13px] font-bold">Your name
          <input required autoComplete="name" value={f.name} onChange={set("name")} placeholder="e.g. Ada Okafor" className={input} />
        </label>
      )}
      <label className="flex flex-col gap-1 text-[13px] font-bold">Email
        <input required type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set("email")} disabled={mode === "code" && sent} placeholder="you@example.com" className={cn(input, "disabled:bg-surface")} />
      </label>
      {mode !== "code" && (
        <label className="flex flex-col gap-1 text-[13px] font-bold">Password
          <span className="relative flex">
            <input required type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : 1} value={f.password} onChange={set("password")} placeholder={mode === "signup" ? "8+ characters, with a number" : ""} className={cn(input, "pr-12")} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1 flex size-10 items-center justify-center text-muted">
              {show ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
            </button>
          </span>
        </label>
      )}
      {mode === "signup" && (
        <label className="flex flex-col gap-1 text-[13px] font-bold">Phone <span className="font-normal text-muted">(for pickup codes, optional now)</span>
          <input type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="0803 000 0000" className={input} />
        </label>
      )}
      {mode === "code" && sent && (
        <label className="flex flex-col gap-1 text-[13px] font-bold">6-digit code
          <input required inputMode="numeric" autoComplete="one-time-code" autoFocus value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, "").slice(0, 6) })} className={cn(input, "text-center font-mono text-xl tracking-[0.5em]")} />
        </label>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={cn("text-[13px] font-semibold", msg.ok ? "text-success" : "text-sale")}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-bold text-white disabled:opacity-60">
        {busy && <Loader2 aria-hidden size={17} className="animate-spin" />}
        {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : sent ? "Sign in" : "Email me a code"}
      </button>
      {mode === "signin" && <button type="button" onClick={() => switchTo("code")} className="min-h-9 text-[13px] text-muted underline">Forgot password? Sign in with an email code</button>}
      {mode === "code" && <button type="button" onClick={() => switchTo("signin")} className="min-h-9 text-[13px] text-muted underline">Back to password sign-in</button>}
      {mode === "signup" && <p className="text-center text-[11px] leading-relaxed text-muted">By creating an account you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy policy</Link>.</p>}
    </form>
  );
}
