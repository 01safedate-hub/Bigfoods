"use client";

import { useEffect } from "react";
import { type ThemeKey, THEMES, themeFor } from "@/lib/events";
import { useSiteData } from "./site-data";

/**
 * Applies the event theme for today's date (Lagos time). `?theme=christmas`
 * previews any theme. The calendar comes from the `sale_events` table.
 */
export function ThemeSync() {
  const { events } = useSiteData();
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("theme") as ThemeKey | null;
    const key = preview && preview in THEMES ? preview : themeFor(Date.now(), events);
    document.documentElement.dataset.theme = key;
  }, [events]);
  return null;
}
