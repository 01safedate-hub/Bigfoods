/** Scales width × height down (never up) so the longest side is at most `max`. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export const IMAGE_RULES = {
  /** Longest side after resizing. Sharp on a 3× phone screen at full width. */
  maxSide: 1600,
  /** Photos smaller than this look blurry on product pages. */
  minSide: 500,
  /** Refuse anything bigger before we even try to decode it. */
  maxInputBytes: 25 * 1024 * 1024,
  quality: 0.82,
  accept: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"],
} as const;
