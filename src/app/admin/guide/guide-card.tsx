"use client";

import { BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PAGE_TIPS } from "./guides";

const key = (page: string) => `fc-guide-skip:${page}`;

/** A short how-to at the top of a screen. "Skip for now" hides it on this device; a small link brings it back. */
export function GuideCard({ page }: { page: keyof typeof PAGE_TIPS }) {
  const tip = PAGE_TIPS[page];
  const [hidden, setHidden] = useState<boolean | null>(null);
  useEffect(() => {
    let v = false;
    try { v = localStorage.getItem(key(page)) === "1"; } catch {}
    const t = setTimeout(() => setHidden(v), 0);
    return () => clearTimeout(t);
  }, [page]);
  const set = (v: boolean) => { setHidden(v); try { if (v) localStorage.setItem(key(page), "1"); else localStorage.removeItem(key(page)); } catch {} };

  if (hidden === null) return null;
  if (hidden) {
    return (
      <button type="button" onClick={() => set(false)} className="flex items-center gap-1.5 self-start text-xs font-semibold text-[#2563EB]">
        <BookOpen aria-hidden size={14} /> Show how this works
      </button>
    );
  }
  return (
    <aside className="relative flex flex-col gap-2 rounded-lg border border-[#C7D7FE] bg-[#EEF4FF] p-3.5 pr-10">
      <strong className="flex items-center gap-1.5 text-[#1D4ED8]"><BookOpen aria-hidden size={16} /> {tip.title}</strong>
      <ol className="flex flex-col gap-1 text-[13px] text-[#1F2937]">
        {tip.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        <Link href={tip.more} className="text-[#1D4ED8] underline">Full guide</Link>
        <button type="button" onClick={() => set(true)} className="text-[#5B6170]">Skip for now</button>
      </div>
      <button type="button" aria-label="Hide guide" onClick={() => set(true)} className="absolute right-2 top-2 p-1.5 text-[#5B6170]"><X size={16} /></button>
    </aside>
  );
}
