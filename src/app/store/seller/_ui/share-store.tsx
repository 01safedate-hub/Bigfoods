"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { btn } from "./ui";

/** Uses the phone's share sheet (WhatsApp, Instagram…) when there is one, otherwise copies the link. */
export function ShareStore({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn.primary}
      onClick={async () => {
        if (navigator.share) {
          await navigator.share({ title: name, text: `Shop ${name}: free delivery to your Jumia pickup station`, url }).catch(() => {});
          return;
        }
        await navigator.clipboard?.writeText(url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check aria-hidden size={17} /> : <Share2 aria-hidden size={17} />} {copied ? "Link copied" : "Share store"}
    </button>
  );
}
