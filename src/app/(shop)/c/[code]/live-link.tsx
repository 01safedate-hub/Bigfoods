"use client";

import { Check, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { naira } from "@/lib/format";
import { type LinkProgress, linkProgress } from "../../actions";

/** Live progress for a real Group pay link. Refreshes every 10 seconds while the page is open. */
export function LiveLink({ code, initial }: { code: string; initial: LinkProgress }) {
  const [p, setP] = useState(initial);
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const next = await linkProgress(code).catch(() => null);
      if (next) setP(next);
    }, 10_000);
    return () => clearInterval(t);
  }, [code]);
  const left = p.target - p.raised;
  // Links stay open until the order is fully paid.
  const closed = left <= 0;
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-6">
      <h1 className="text-xl font-extrabold">Help pay for this order</h1>
      <section className="flex flex-col gap-2 rounded-lg bg-group-soft p-4">
        <div className="flex items-baseline justify-between">
          <strong className="text-2xl">{naira(p.raised)}</strong>
          <span className="text-sm text-muted">of {naira(p.target)}</span>
        </div>
        <Progress value={(p.raised / p.target) * 100} className="h-2.5 bg-[#E0DEF7]" barClass="bg-group" label="Raised so far" />
        <span className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-bold text-group"><Users aria-hidden size={13} /> {p.people} {p.people === 1 ? "person has" : "people have"} chipped in · live</span>
          <span className="text-muted">{closed ? "Fully paid" : "Open until fully paid"}</span>
        </span>
      </section>
      <section className="flex flex-col rounded-lg border border-line bg-white">
        {p.items.map((i, k) => (
          <div key={k} className="flex items-center justify-between gap-2 border-t border-line p-3 first:border-0">
            <span className="flex min-w-0 items-center gap-2">
              {i.funded ? <Check aria-label="Paid" size={16} className="shrink-0 text-success" /> : <span className="size-4 shrink-0 rounded-full border border-black/20" />}
              <span className="truncate">{i.title}</span>
            </span>
            <strong className="shrink-0">{naira(i.amount)}</strong>
          </div>
        ))}
      </section>
      <button type="button" disabled className="min-h-12 rounded-md bg-group text-sm font-extrabold text-white opacity-60">
        {left > 0 && !closed ? `CHIP IN · ${naira(left)} TO GO` : "FULLY PAID · THANK YOU"}
      </button>
      <p className="text-center text-xs text-muted">Card, transfer and USSD payments open soon. You never see the buyer’s phone number or address.</p>
    </div>
  );
}
