import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInView } from "./sign-in-view";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-80" />}>
      <SignInView />
    </Suspense>
  );
}
