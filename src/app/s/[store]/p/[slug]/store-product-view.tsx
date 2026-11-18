"use client";

import { Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductTile } from "@/components/shop/product-card";
import type { Product, Variant } from "@/lib/catalog/types";
import { choose, findVariant, initialChoice, LOW_STOCK, optionStates } from "@/lib/catalog/variants";
import type { ThemeKey } from "@/lib/dropship/plans";
import { headlineClass } from "@/lib/dropship/theme-tokens";
import { cn, naira } from "@/lib/format";
import { useBag } from "../../../bag-provider";

const price = (v: Variant) => v.prices.list;

export function StoreProductView({ product, base, theme, open }: { product: Product; base: string; theme: ThemeKey; open: boolean }) {
  const { add } = useBag();
  const [choice, setChoice] = useState(() => initialChoice(product));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [photo, setPhoto] = useState(0);
  const variant = findVariant(product, choice);
  const states = optionStates(product, choice, price);
  const stock = variant?.stock ?? 0;
  const canBuy = open && Boolean(variant) && stock > 0;
  const label = product.options.map((o) => choice[o.name]).filter(Boolean).join(" / ");
  const photos = [...new Set([variant?.image, ...product.images].filter((x): x is string => Boolean(x)))];
  const shown = photos[Math.min(photo, Math.max(0, photos.length - 1))];
  const maxQty = Math.max(1, Math.min(10, stock));

  const addToBag = () => {
    if (!variant || !canBuy) return;
    add({ slug: product.slug, variantId: variant.id, qty, name: product.name, variantLabel: label, price: price(variant), image: variant.image ?? product.images[0] ?? null, tint: product.tint, icon: product.icon });
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };
  const cta = !open ? "Not taking orders right now" : !variant ? "Choose an option" : stock <= 0 ? "Sold out" : added ? "Added to your bag" : "Add to bag";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-28 pt-4 md:grid-cols-[1.1fr_1fr] md:gap-10 md:px-6 md:pb-12 md:pt-8">
      {/* Photos: big image, thumbnails underneath (scrollable on phones). */}
      <div className="flex min-w-0 flex-col gap-2 md:sticky md:top-20 md:self-start">
        <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={shown} className="aspect-[4/5] w-full rounded-[var(--st-radius)]" iconSize={96} sizes="(min-width: 768px) 560px, 100vw" priority />
        {photos.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {photos.map((src, i) => (
              <button key={src} type="button" aria-label={`Photo ${i + 1} of ${photos.length}`} aria-pressed={shown === src} onClick={() => setPhoto(i)}
                className={cn("shrink-0 rounded-[var(--st-radius)] ring-2 ring-offset-2 ring-offset-[var(--st-bg)]", shown === src ? "ring-[var(--st-accent)]" : "ring-transparent")}>
                <ProductTile tint={product.tint} icon={product.icon} name="" image={src} className="size-16 rounded-[var(--st-radius)]" iconSize={24} sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Link href={base} className="w-fit text-[13px] text-[var(--st-muted)] underline-offset-4 hover:underline">← Back to the store</Link>
        <div className="flex flex-col gap-2">
          <h1 className={cn("break-words text-[26px] leading-tight sm:text-[32px] md:text-[38px]", headlineClass(theme))}>{product.name}</h1>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="text-[26px] tabular-nums">{naira(variant ? price(variant) : product.prices.list)}</strong>
            {variant && stock > 0 && stock <= LOW_STOCK && <span className="text-[13px] font-semibold text-[#DC2626]">Only {stock} left</span>}
            {variant && stock <= 0 && <span className="text-[13px] font-semibold text-[var(--st-muted)]">Sold out in this option</span>}
          </div>
        </div>

        {product.options.map((o) => {
          const isColour = o.values.some((v) => v.hex) || /colou?r/i.test(o.name);
          return (
            <fieldset key={o.name} className="min-w-0">
              <legend className="mb-2 text-[13px] font-semibold">
                {o.name}: <span className="font-normal text-[var(--st-muted)]">{choice[o.name]}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {states[o.name].map((s) => {
                  const selected = choice[o.name] === s.label;
                  const soldOut = s.exists && !s.inStock;
                  const note = soldOut ? ", sold out" : !s.exists ? ", other options will change" : s.delta ? `, ${s.delta > 0 ? "+" : "−"}${naira(Math.abs(s.delta))}` : "";
                  return (
                    <button key={s.label} type="button" aria-pressed={selected} aria-label={`${s.label}${note}`} disabled={soldOut && !selected}
                      onClick={() => { setChoice(choose(product, choice, o.name, s.label)); setPhoto(0); setQty(1); }}
                      className={cn(
                        "relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--st-radius)] border px-3 text-[14px] transition-colors",
                        selected ? "border-[var(--st-fg)] font-bold" : "border-[var(--st-line)] hover:border-[var(--st-muted)]",
                        soldOut && "cursor-not-allowed text-[var(--st-muted)] line-through opacity-60",
                        !s.exists && !selected && "border-dashed opacity-75",
                      )}>
                      {isColour && (s.image
                        ? <ProductTile tint={product.tint} icon={product.icon} name="" image={s.image} className="size-6 rounded-full" iconSize={12} sizes="24px" />
                        : s.hex ? <span aria-hidden className="size-5 rounded-full border border-black/15" style={{ background: s.hex }} /> : null)}
                      <span>{s.label}</span>
                      {s.delta !== 0 && !selected && <span className="text-[11px] text-[var(--st-muted)]">{s.delta > 0 ? "+" : "−"}{naira(Math.abs(s.delta))}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center rounded-full border border-[var(--st-line)]" role="group" aria-label="Quantity">
            <button type="button" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className="flex size-11 items-center justify-center disabled:opacity-30"><Minus aria-hidden size={15} /></button>
            <span className="w-8 text-center text-[15px] font-bold tabular-nums" aria-live="polite">{qty}</span>
            <button type="button" aria-label="One more" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)} className="flex size-11 items-center justify-center disabled:opacity-30"><Plus aria-hidden size={15} /></button>
          </span>
          <button type="button" disabled={!canBuy} onClick={addToBag}
            className="hidden min-h-12 flex-1 items-center justify-center gap-2 rounded-[var(--st-radius)] px-6 text-[16px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40 md:flex"
            style={{ background: "var(--st-accent)" }}>
            {added ? <Check aria-hidden size={19} /> : <ShoppingBag aria-hidden size={19} />} {cta}
          </button>
        </div>
        {added && <Link href={`${base}/bag`} className="text-[14px] font-semibold underline underline-offset-4">View bag and check out →</Link>}

        <p className="flex items-start gap-2 rounded-[var(--st-radius)] bg-[var(--st-card)] p-3 text-[13px]">
          <Truck aria-hidden size={17} className="mt-0.5 shrink-0" />
          <span>Free delivery to your Jumia pickup station in about {product.shipMode === "sea" ? "90+" : "10–18"} days. Full refund if it never arrives.</span>
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--st-muted)]">{product.description}</p>
        {product.specs.length > 0 && (
          <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-6 gap-y-2 border-t border-[var(--st-line)] pt-4 text-[14px]">
            {product.specs.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-[var(--st-muted)]">{k}</dt><dd className="break-words">{v}</dd></div>
            ))}
          </dl>
        )}
      </div>

      {/* Phones: price and button always within thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-[var(--st-line)] bg-[var(--st-bg)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <span className="min-w-0">
          <strong className="block text-[17px] tabular-nums">{naira((variant ? price(variant) : product.prices.list) * qty)}</strong>
          <span className="block truncate text-[12px] text-[var(--st-muted)]">{label || product.name}{qty > 1 ? ` × ${qty}` : ""}</span>
        </span>
        <button type="button" disabled={!canBuy} onClick={addToBag}
          className="ml-auto flex min-h-12 shrink-0 items-center gap-2 rounded-[var(--st-radius)] px-5 text-[15px] font-bold text-white disabled:opacity-40" style={{ background: "var(--st-accent)" }}>
          {added ? <Check aria-hidden size={18} /> : <ShoppingBag aria-hidden size={18} />} {cta}
        </button>
      </div>
    </div>
  );
}
