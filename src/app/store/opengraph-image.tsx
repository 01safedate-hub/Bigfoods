import { ImageResponse } from "next/og";
import { OgCard } from "@/components/seo/og-card";

export const alt = "FastChina.store: start a dropshipping store in Nigeria for free";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<OgCard dark kicker="Dropship · Wholesale" title="Start your dropshipping store in Nigeria for free" foot="fastchina.store" />, size);
}
