"use client";

import { MailX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

/** A button, not an automatic action: email scanners open links, and that shouldn't unsubscribe anyone. */
export function UnsubscribeView() {
  const q = useSearchParams();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
      <MailX aria-hidden size={36} />
      <h1 className="text-xl font-extrabold">{state === "done" ? "You’re unsubscribed" : "Stop offer emails?"}</h1>
      <p className="text-muted">
        {state === "done"
          ? "You won’t get Midnight Drop or event emails any more. Order and payment emails still come, because they’re about your money."
          : "You’ll still get emails about your orders, payments and refunds."}
      </p>
      {state !== "done" && (
        <button
          type="button"
          disabled={state === "busy"}
          onClick={async () => {
            setState("busy");
            const r = await fetch(`/api/unsubscribe?u=${encodeURIComponent(q.get("u") ?? "")}&t=${encodeURIComponent(q.get("t") ?? "")}`, { method: "POST" }).catch(() => null);
            setState(r?.ok ? "done" : "error");
          }}
          className="min-h-11 rounded-md bg-ink px-5 text-sm font-extrabold text-white"
        >
          UNSUBSCRIBE
        </button>
      )}
      {state === "error" && <p role="alert" className="text-sale">That link didn’t work. You can change emails under My account → Notifications.</p>}
      <Link href="/account" className="text-sm underline">Notification settings</Link>
    </div>
  );
}
