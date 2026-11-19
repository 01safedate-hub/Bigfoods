"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
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
    // Desktop: the welcome banner on the left, the form on the right.
    <div className="grid w-full gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,420px)] lg:items-center lg:gap-14 lg:px-0 lg:py-12">
      <div className="hidden flex-col gap-4 lg:flex">
        <Image src="/brand/welcome-wholesale.webp" alt="Chinese market brought to you by FastChina" width={1600} height={900} className="h-auto w-full rounded-3xl" sizes="(min-width: 1360px) 760px, 55vw" />
        <ul className="grid grid-cols-3 gap-3 text-[13px]">
          {["Free delivery to your pickup station", "Pay small small at 0% interest", "Wholesale and free dropship stores"].map((t) => (
            <li key={t} className="rounded-2xl bg-surface p-4 font-semibold">{t}</li>
          ))}
        </ul>
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5 lg:mx-0 lg:max-w-none">
      <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
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
    </div>
  );
}
