"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changePassword, updateProfile } from "../../../auth-actions";

const input = "min-h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[16px] outline-none focus:border-ink disabled:bg-surface disabled:text-muted";
type Msg = { ok: boolean; text: string } | null;
const Note = ({ m }: { m: Msg }) => (m ? <p role={m.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${m.ok ? "text-success" : "text-sale"}`}>{m.text}</p> : null);

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const router = useRouter();
  const [f, setF] = useState({ name, phone });
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile(f).catch(() => ({ ok: false as const, message: "You seem to be offline. Try again." }));
          setMsg(r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.message });
          if (r.ok) router.refresh();
        });
      }}
    >
      <label className="flex flex-col gap-1 text-[13px] font-bold">Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" className={input} /></label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Phone (for pickup codes)<input type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0803 000 0000" autoComplete="tel" className={input} /></label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Email<input value={email} disabled className={input} /></label>
      <Note m={msg} />
      <button type="submit" disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink font-bold text-white disabled:opacity-60">{busy && <Loader2 aria-hidden size={16} className="animate-spin" />}Save</button>
    </form>
  );
}

export function PasswordForm() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changePassword(pw).catch(() => ({ ok: false as const, message: "You seem to be offline. Try again." }));
          setMsg(r.ok ? { ok: true, text: "Password changed" } : { ok: false, text: r.message });
          if (r.ok) setPw("");
        });
      }}
    >
      <label className="flex flex-col gap-1 text-[13px] font-bold">New password<input type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8+ characters, with a number" className={input} /></label>
      <Note m={msg} />
      <button type="submit" disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink font-bold disabled:opacity-60">{busy && <Loader2 aria-hidden size={16} className="animate-spin" />}Change password</button>
    </form>
  );
}
