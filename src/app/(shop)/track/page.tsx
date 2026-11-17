import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackView } from "./track-view";

export const metadata: Metadata = { title: "Track an order", robots: { index: false } };

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="h-80" />}>
      <TrackView />
    </Suspense>
  );
}
