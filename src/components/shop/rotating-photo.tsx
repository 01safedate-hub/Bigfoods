"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * A real product photo that changes every few seconds (a fade, no motion when reduced motion is on).
 * Shows `fallback` (an icon) when there are no photos yet.
 */
export function RotatingPhoto({ images, every = 5000, offset = 0, sizes, className, fallback, contain = false }: {
  images: string[];
  every?: number;
  /** Staggers tiles so they don't all change at once. */
  offset?: number;
  sizes: string;
  className?: string;
  fallback?: ReactNode;
  contain?: boolean;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      t = setInterval(() => document.visibilityState === "visible" && setTick((n) => n + 1), every);
    }, (offset % 7) * 600);
    return () => { clearTimeout(start); clearInterval(t); };
  }, [images.length, every, offset]);
  if (!images.length) return <>{fallback}</>;
  const src = images[(tick + offset) % images.length];
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <Image key={src} src={src} alt="" fill sizes={sizes} className={cn("promo-fade", contain ? "object-contain" : "object-cover")} />
    </span>
  );
}
