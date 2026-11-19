"use client";

import { fitWithin, IMAGE_RULES } from "./fit";

export interface Compressed {
  blob: Blob;
  type: string;
  ext: "webp" | "jpg";
  width: number;
  height: number;
  /** Content fingerprint: used as the file name, so a stored photo never changes at the same address and can be cached for a year. */
  hash: string;
  before: number;
  after: number;
  warning?: string;
}

async function encode(canvas: HTMLCanvasElement | OffscreenCanvas, type: string, quality: number): Promise<Blob | null> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality }).catch(() => null);
  return new Promise((r) => (canvas as HTMLCanvasElement).toBlob(r, type, quality));
}

async function sha(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Shrinks a photo in the browser before upload: corrects phone rotation, resizes to 1600px,
 * strips location data (EXIF) and re-encodes as WebP (JPEG where WebP isn't supported).
 * A 6 MB phone photo usually becomes 150–350 KB, so uploads work on slow data.
 */
export async function compressImage(file: File): Promise<Compressed> {
  if (file.size > IMAGE_RULES.maxInputBytes) throw new Error("That photo is over 25 MB. Choose a smaller one.");
  if (file.type && !file.type.startsWith("image/")) throw new Error("That file isn't a photo.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This browser can't read that photo. Try a JPEG or PNG.");
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, IMAGE_RULES.maxSide);
  const canvas: HTMLCanvasElement | OffscreenCanvas =
    typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Couldn't process the photo.");
  // White behind transparent PNGs, so they don't turn black as JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await encode(canvas, "image/webp", IMAGE_RULES.quality);
  let ext: Compressed["ext"] = "webp";
  // Older Safari returns PNG when asked for WebP.
  if (!blob || blob.type !== "image/webp") {
    blob = await encode(canvas, "image/jpeg", IMAGE_RULES.quality);
    ext = "jpg";
  }
  if (!blob) throw new Error("Couldn't process the photo.");

  const short = Math.min(width, height);
  return {
    blob, type: blob.type, ext, width, height,
    hash: await sha(blob),
    before: file.size,
    after: blob.size,
    warning: short < IMAGE_RULES.minSide ? `Small photo (${width}×${height}). It may look blurry on the product page.` : undefined,
  };
}
