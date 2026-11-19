import { ImageResponse } from "next/og";
import { OgCard } from "@/components/seo/og-card";

export const alt = "FastChina: China's factories, delivered free in Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<OgCard kicker="Shop China in Naira" title="China’s factories, delivered free to your pickup station" />, size);
}
