"use client";

import { createContext, use } from "react";
import type { SiteData } from "@/lib/data/site";

const Ctx = createContext<SiteData | null>(null);

export function SiteDataProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <Ctx value={value}>{children}</Ctx>;
}

export function useSiteData(): SiteData {
  const v = use(Ctx);
  if (!v) throw new Error("useSiteData must be used inside the shop layout");
  return v;
}
