"use client";

import { useEffect } from "react";
import { recordVisit } from "./actions";

/** One visit per browser session, so sellers see real numbers, not page refreshes. */
export function VisitPing({ storeId }: { storeId: string }) {
  useEffect(() => {
    const key = `fc-visit-${storeId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void recordVisit(storeId).catch(() => {});
  }, [storeId]);
  return null;
}
