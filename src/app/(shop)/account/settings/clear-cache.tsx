"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const fmt = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)}MB` : `${Math.round(b / 1024)}KB`);

/** Shows how much the app keeps offline and clears it (saved pages and photos). Cart, wishlist and sign-in stay. */
export function ClearCacheRow() {
  const [size, setSize] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const measure = () =>
    navigator.storage?.estimate?.().then((e) => setSize(fmt(e.usage ?? 0))).catch(() => setSize(null));
  useEffect(() => {
    void measure();
  }, []);
  return (
    <button
      type="button"
      onClick={async () => {
        if (!("caches" in window)) return;
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        setDone(true);
        void measure();
      }}
      className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-[15px] font-light hover:bg-surface"
    >
      <span className="flex-1">Clear cache</span>
      <span aria-live="polite" className="text-[14px] text-muted">{done ? "Cleared" : size ?? ""}</span>
      <ChevronRight aria-hidden size={18} className="text-subtle" />
    </button>
  );
}
