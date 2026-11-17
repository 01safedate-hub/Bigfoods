import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeView } from "./unsubscribe-view";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="h-80" />}>
      <UnsubscribeView />
    </Suspense>
  );
}
