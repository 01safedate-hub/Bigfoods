"use client";

import Image, { type ImageProps } from "next/image";
import { type ReactNode, useState } from "react";

/** A product photo that falls back to the placeholder if it can't load (offline, removed, slow network). */
export function SafeImage({ fallback, ...props }: ImageProps & { fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <Image {...props} alt={props.alt} onError={() => setFailed(true)} />;
}
