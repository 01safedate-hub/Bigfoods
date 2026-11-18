"use client";

import { useBag } from "./bag-provider";

export function BagCount() {
  const { count } = useBag();
  return count ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-black" aria-label={`${count} items`}>{count}</span> : null;
}
