"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { PendingQuestion } from "@/lib/data/admin";
import { answerQuestion } from "../actions";

const QUICK = [
  "Yes. ",
  "No, sorry. ",
  "It ships by air and reaches your pickup station in about 10–18 days.",
  "Shipping to your Jumia pickup station is free and customs clearing is included.",
];

const ago = (iso: string) => {
  const h = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 3_600_000));
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

export function QuestionsView({ questions }: { questions: PendingQuestion[] }) {
  const [list, setList] = useState(questions);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const act = (q: PendingQuestion, hide: boolean) =>
    start(async () => {
      const r = await answerQuestion(q.id, drafts[q.id] ?? "", hide);
      if (r.ok) setList((l) => l.filter((x) => x.id !== q.id));
      else setErrors((e) => ({ ...e, [q.id]: r.message }));
    });

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Q&amp;A inbox</h1>
        <p className="text-[#5B6170]">Oldest first. Answers appear on the product page straight away. Hide spam or anything that isn’t a product question.</p>
      </div>
      {list.length === 0 && <p className="rounded-lg bg-white p-6 text-center text-[#5B6170]">All caught up. No questions waiting.</p>}
      <div className="flex flex-col gap-2.5">
        {list.map((q) => (
          <form
            key={q.id}
            onSubmit={(e) => {
              e.preventDefault();
              act(q, false);
            }}
            className="flex flex-col gap-2.5 rounded-lg border border-[#E3E5EA] bg-white p-3.5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/product/${q.slug}#qa`} target="_blank" className="text-xs font-semibold text-[#2563EB] underline">{q.product}</Link>
              <span className="text-xs text-[#5B6170]">{q.asker} · {ago(q.askedAt)}</span>
            </div>
            <strong className="text-[15px]">{q.question}</strong>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map((t) => (
                <button key={t} type="button" onClick={() => setDrafts((d) => ({ ...d, [q.id]: (d[q.id] ?? "") + t }))} className="rounded-full border border-[#D0D4DB] px-2.5 py-1 text-xs">
                  {t.length > 32 ? `${t.slice(0, 30)}…` : t.trim()}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor={`a-${q.id}`}>Answer</label>
            <textarea id={`a-${q.id}`} rows={2} maxLength={1000} value={drafts[q.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
              placeholder="Write a short, clear answer" className="rounded-md border border-[#D0D4DB] p-2.5 text-sm" />
            {errors[q.id] && <p role="alert" className="text-sale">{errors[q.id]}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={pending} onClick={() => act(q, true)} className="min-h-10 rounded-md border border-[#D0D4DB] px-3 font-semibold">Hide</button>
              <button type="submit" disabled={pending} className="min-h-10 rounded-md bg-ink px-4 font-bold text-white disabled:opacity-50">Answer</button>
            </div>
          </form>
        ))}
      </div>
    </>
  );
}
