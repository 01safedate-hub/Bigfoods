"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useOnline } from "@/hooks/use-online";

/** What people see when a section fails to load: plain words, a retry, and a way out. */
export function ErrorPanel({ error, reset, home = "/" }: { error: Error & { digest?: string }; reset: () => void; home?: string }) {
  const online = useOnline();
  useEffect(() => {
    console.error(error);
  }, [error]);
  // Coming back online is the most common fix, so retry automatically.
  useEffect(() => {
    if (online) return;
    const retry = () => reset();
    window.addEventListener("online", retry, { once: true });
    return () => window.removeEventListener("online", retry);
  }, [online, reset]);
  return (
    <div role="alert" className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-16 text-center">
      {online ? <RefreshCw aria-hidden size={30} /> : <WifiOff aria-hidden size={30} />}
      <h1 className="text-xl font-extrabold">{online ? "This didn’t load" : "You’re offline"}</h1>
      <p className="text-muted">
        {online ? "Something went wrong on our side. Your cart is safe. Try again in a moment." : "Reconnect and this page will load by itself. Your cart is saved on this device."}
      </p>
      {error.digest && <p className="text-xs text-muted">Reference: {error.digest}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="min-h-11 rounded-md bg-ink px-5 text-sm font-extrabold text-white">TRY AGAIN</button>
        <Link href={home} className="flex min-h-11 items-center rounded-md border border-black/20 px-5 text-sm font-bold">Home</Link>
      </div>
    </div>
  );
}
