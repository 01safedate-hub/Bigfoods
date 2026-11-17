"use client";

import { useCallback, useEffect, useState } from "react";

/** useState that remembers its value in localStorage (best effort; storage can be unavailable). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: T | undefined;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) saved = JSON.parse(raw) as T;
    } catch {
      /* storage blocked */
    }
    const id = setTimeout(() => {
      if (saved !== undefined) setValue(saved);
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* storage blocked */
        }
        return v;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}
