"use client";

import { Loader2, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { sendFeedback } from "../../../auth-actions";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  if (msg?.ok) return <p role="status" className="rounded-xl bg-success-soft p-4 text-[15px] font-semibold text-success">Thank you. Your feedback was sent.</p>;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await sendFeedback({ rating: rating || undefined, message: text, page: "settings" }).catch(() => ({ ok: false as const, message: "You seem to be offline. Try again." }));
          setMsg(r.ok ? { ok: true, text: "" } : { ok: false, text: r.message });
        });
      }}
    >
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="flex size-11 items-center justify-center">
            <Star aria-hidden size={30} strokeWidth={1.4} className={n <= rating ? "fill-gold text-gold" : "text-subtle"} />
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Tell us more <span className="font-normal text-muted">(optional)</span>
        <textarea rows={5} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What should we improve?" className="rounded-xl border border-line p-3 text-[16px] font-normal outline-none focus:border-ink" />
      </label>
      {msg && !msg.ok && <p role="alert" className="text-[13px] font-semibold text-sale">{msg.text}</p>}
      <button type="submit" disabled={busy || (!rating && text.trim().length < 3)} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink font-bold text-white disabled:opacity-40">{busy && <Loader2 aria-hidden size={16} className="animate-spin" />}Send</button>
    </form>
  );
}
