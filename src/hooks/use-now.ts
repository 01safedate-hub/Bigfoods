"use client";

import { useEffect, useState } from "react";

/**
 * Current time, ticking every `intervalMs`. Returns null until mounted so the
 * prerendered HTML never depends on the clock (no hydration mismatches).
 */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
