"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { Product, Variant } from "@/lib/catalog/types";
import { cn, naira } from "@/lib/format";
import { useWholesaleCart, wcart } from "@/lib/wholesale/cart";
import { MIN_QTY } from "@/lib/wholesale/rules";

const labelOf = (v: Variant) => Object.values(v.props).join(" / ") || "Standard";

/**
 * Wholesale quantities for one product: units per colour/size, mixed freely, at least MIN_QTY in total.
 * Starts from what's already in the wholesale cart, so opening it again edits the same order.
 */
export function useMix(product: Product) {
  const cart = useWholesaleCart();
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(cart.filter((l) => l.slug === product.slug).map((l) => [l.variantId, l.qty])));
  const variants = product.variants.filter((v) => v.wholesale > 0);
  const total = variants.reduce((s, v) => s + (qty[v.id] ?? 0), 0);
  const cost = variants.reduce((s, v) => s + (qty[v.id] ?? 0) * v.wholesale, 0);
  const inCart = cart.filter((l) => l.slug === product.slug).reduce((s, l) => s + l.qty, 0);
  return {
    variants,
    qty,
    total,
    cost,
    inCart,
    ok: total >= MIN_QTY,
    set: (v: Variant, n: number) => setQty((q) => ({ ...q, [v.id]: Math.max(0, Math.min(9999, n)) })),
    /** Puts exactly these quantities in the wholesale cart (variants at 0 are removed). */
    save: () => {
      for (const v of variants) wcart.add(product, v, qty[v.id] ?? 0, true);
    },
  };
}

export type Mix = ReturnType<typeof useMix>;

/** One row per colour/size with a quantity stepper. The first tap on + adds 5 to get going quickly. */
export function MixRows({ mix }: { mix: Mix }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {mix.variants.map((v) => {
        const n = mix.qty[v.id] ?? 0;
        return (
          <li key={v.id} className="flex items-center gap-3 py-2.5">
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-[14px]">{labelOf(v)}</strong>
              <span className="text-[12px] text-muted">{naira(v.wholesale)}/unit{v.stock < 1 ? " · out of stock" : ""}</span>
            </span>
            <span className="flex items-center rounded-full border border-line">
              <button type="button" aria-label={`Fewer ${labelOf(v)}`} disabled={!n} onClick={() => mix.set(v, n - 1)} className="flex size-9 items-center justify-center disabled:opacity-30"><Minus aria-hidden size={14} /></button>
              <input aria-label={`Units of ${labelOf(v)}`} inputMode="numeric" value={n} onChange={(e) => mix.set(v, Number(e.target.value.replace(/\D/g, "")) || 0)} className="w-11 text-center text-[14px] font-bold tabular-nums outline-none" />
              <button type="button" aria-label={`More ${labelOf(v)}`} disabled={v.stock < 1} onClick={() => mix.set(v, n + (n ? 1 : 5))} className="flex size-9 items-center justify-center disabled:opacity-30"><Plus aria-hidden size={14} /></button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Green when the minimum is reached, red with how many more are needed when it isn't. */
export function MixStatus({ mix, className }: { mix: Mix; className?: string }) {
  return (
    <p aria-live="polite" className={cn("rounded-lg px-3 py-2 text-[13px] font-semibold", mix.ok ? "bg-success-soft text-success" : "bg-[#FFF1F2] text-sale", className)}>
      {mix.ok ? `${mix.total} units · ${naira(mix.cost)}` : `${mix.total} of ${MIN_QTY} units: add ${MIN_QTY - mix.total} more`}
    </p>
  );
}
