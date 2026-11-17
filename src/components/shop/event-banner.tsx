"use client";

import Link from "next/link";
import { useNow } from "@/hooks/use-now";
import { THEMES, themeFor } from "@/lib/events";

export function EventBanner() {
  const now = useNow(60_000);
  const t = THEMES[now === null ? "everyday" : themeFor(now)];
  return (
    <Link
      href="/deals"
      className="relative flex h-44 flex-col justify-between overflow-hidden rounded-md p-[18px] md:h-full md:min-h-[300px] md:p-8"
      style={{ background: "var(--banner-bg)", color: "var(--banner-fg)" }}
    >
      <svg aria-hidden width="220" height="220" viewBox="0 0 100 100" className="absolute -bottom-16 -right-12 md:-bottom-24 md:size-[380px]">
        <circle cx="50" cy="50" r="49" fill="var(--banner-accent)" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="var(--banner-hi)" strokeWidth="0.8" />
      </svg>
      <span className="relative text-[10px] font-extrabold tracking-[0.16em] md:text-xs" style={{ color: "var(--banner-hi)" }}>
        {t.kicker}
      </span>
      <span className="relative whitespace-pre-line text-4xl leading-[0.95] font-extrabold tracking-tight md:text-7xl">{t.title}</span>
      <span className="relative flex items-center justify-between gap-3">
        <span className="text-[11px] opacity-85 md:text-[15px]">{t.sub}</span>
        <span className="shrink-0 px-3 py-2 text-[11px] font-extrabold md:px-6 md:py-3 md:text-[13px]" style={{ background: "var(--banner-hi)", color: "var(--banner-hi-fg)" }}>
          SHOP THE EVENT
        </span>
      </span>
    </Link>
  );
}
