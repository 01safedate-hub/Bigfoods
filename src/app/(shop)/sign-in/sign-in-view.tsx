"use client";

import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandWordmark } from "@/components/shop/brand";
import { AuthForm } from "@/components/shop/auth-form";
import { getStationId, markWelcomeDone } from "@/lib/station-store";

/** Sign in, or create an account in one step (no email verification). */
export function SignInView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const mode = params.get("mode") === "signin" ? "signin" : params.get("mode") === "code" ? "code" : "signup";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandWordmark className="h-9 w-auto" />
        <h1 className="text-2xl font-extrabold">{mode === "signup" ? "Join FastChina" : "Welcome back"}</h1>
        <p className="text-muted">China’s factories, delivered free to your Jumia pickup station.</p>
      </div>
      <AuthForm
        initial={mode}
        stationId={typeof window === "undefined" ? null : getStationId()}
        onDone={() => {
          markWelcomeDone();
          router.replace(safeNext);
          router.refresh();
        }}
      />
      <p className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
        <Lock aria-hidden size={14} className="mt-0.5 shrink-0" /> Your password is stored encrypted. We use your phone only for order updates and pickup codes, and never share it with sellers.
      </p>
    </div>
  );
}
