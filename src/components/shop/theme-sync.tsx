"use client";

import { useEffect } from "react";
import { type ThemeKey, THEMES, themeFor } from "@/lib/events";

/**
 * Applies the event theme for today's date (Lagos time). `?theme=christmas`
 * previews any theme. In production the active theme comes from the events table.
 */
export function ThemeSync() {
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("theme") as ThemeKey | null;
    const key = preview && preview in THEMES ? preview : themeFor(Date.now());
    document.documentElement.dataset.theme = key;
  }, []);
  return null;
}
