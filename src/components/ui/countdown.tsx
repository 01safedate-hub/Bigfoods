"use client";

import { useNow } from "@/hooks/use-now";
import { dhm, flashEnds, hms, midnightDrop, nextDraw } from "@/lib/time";

type Target = "midnight" | "flash" | "draw";

const msLeft = (target: Target, now: number) =>
  target === "midnight" ? midnightDrop(now).msLeft : target === "flash" ? flashEnds(now) : nextDraw(now);

/** hh:mm:ss under a day, otherwise "3d 19h 06m". */
function format(ms: number) {
  if (ms < 86_400_000) return hms(ms);
  const t = dhm(ms);
  return `${t.d}d ${t.h}h ${t.m}m`;
}

/** Ticking countdown. Renders a stable placeholder until the clock is known. */
export function Countdown({ target, className }: { target: Target; className?: string }) {
  const now = useNow();
  return (
    <span className={className} suppressHydrationWarning>
      <span className="tabular-nums">{now === null ? "--:--:--" : format(msLeft(target, now))}</span>
    </span>
  );
}

/** "Live now" vs "starts in" copy for the Midnight Drop. */
export function MidnightLabel({ live, idle }: { live: string; idle: string }) {
  const now = useNow(30_000);
  return <>{now !== null && midnightDrop(now).live ? live : idle}</>;
}
