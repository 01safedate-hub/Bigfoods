"use client";

import { Check, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductTile } from "@/components/shop/product-card";
import type { Product } from "@/lib/catalog/types";
import type { ThemeKey } from "@/lib/dropship/plans";
import { headlineClass } from "@/lib/dropship/theme-tokens";
import { cn, naira } from "@/lib/format";
import { useBag } from "../../../bag-provider";

export function StoreProductView({ product, base, theme, open }: { product: Product; base: string; theme: ThemeKey; open: boolean }) {
  const { add } = useBag();
  const [choice, setChoice] = useState<Record<string, string>>(() => Object.fromEntries(product.options.map((o) => [o.name, o.values[0]?.label ?? ""])));
  const [added, setAdded] = useState(false);
  const variant = product.variants.find((v) => product.options.every((o) => v.props[o.name] === choice[o.name])) ?? product.variants[0];
  const label = product.options.map((o) => choice[o.name]).filter(Boolean).join(" / ");
  const [photo, setPhoto] = useState(0);
  const photos = variant?.image ? [variant.image, ...product.images.filter((i) => i !== variant.image)] : product.images;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-2 md:px-6 md:py-10">
      <div className="flex flex-col gap-2">
        <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={photos[photo]} className="aspect-[4/5] w-full rounded-[var(--st-radius)]" iconSize={96} sizes="(min-width: 768px) 560px, 100vw" priority />
        {photos.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {photos.map((src, i) => (
              <button key={src} type="button" aria-label={`Photo ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)} className={cn("shrink-0 rounded-[var(--st-radius)] ring-2", photo === i ? "ring-[var(--st-accent)]" : "ring-transparent")}>
                <ProductTile tint={product.tint} icon={product.icon} name="" image={src} className="size-16 rounded-[var(--st-radius)]" iconSize={24} sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <Link href={base} className="text-[13px] text-[var(--st-muted)] underline-offset-4 hover:underline">← Back to the store</Link>
        <h1 className={cn("text-[30px] leading-tight md:text-[38px]", headlineClass(theme))}>{product.name}</h1>
        <strong className="text-[26px]">{naira(variant?.prices.list ?? product.prices.list)}</strong>
        {product.options.map((o) => (
          <fieldset key={o.name}>
            <legend className="mb-2 text-[13px] font-semibold">{o.name}: <span className="font-normal text-[var(--st-muted)]">{choice[o.name]}</span></legend>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v) => (
                <button key={v.label} type="button" aria-pressed={choice[o.name] === v.label} onClick={() => setChoice({ ...choice, [o.name]: v.label })}
                  className={cn("flex min-h-11 min-w-11 items-center gap-2 rounded-[var(--st-radius)] border px-3 text-[14px]", choice[o.name] === v.label ? "border-[var(--st-fg)] font-bold" : "border-[var(--st-line)]")}>
                  {v.hex && <span aria-hidden className="size-4 rounded-full border border-black/10" style={{ background: v.hex }} />}{v.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="button" disabled={!open || !variant}
          onClick={() => {
            add({ slug: product.slug, variantId: variant!.id, qty: 1, name: product.name, variantLabel: label, price: variant!.prices.list, image: variant!.image ?? product.images[0] ?? null, tint: product.tint, icon: product.icon });
            setAdded(true);
            setTimeout(() => setAdded(false), 2200);
          }}
          className="flex min-h-14 items-center justify-center gap-2 rounded-[var(--st-radius)] text-[16px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40" style={{ background: "var(--st-accent)" }}>
          {added ? <Check aria-hidden size={19} /> : <ShoppingBag aria-hidden size={19} />} {open ? (added ? "Added to your bag" : "Add to bag") : "Not taking orders right now"}
        </button>
        {added && <Link href={`${base}/bag`} className="text-center text-[14px] font-semibold underline underline-offset-4">View bag and check out</Link>}
        <p className="flex items-start gap-2 rounded-[var(--st-radius)] bg-[var(--st-card)] p-3 text-[13px]">
          <Truck aria-hidden size={17} className="mt-0.5 shrink-0" />
          <span>Free delivery to your Jumia pickup station, about {product.shipMode === "sea" ? "90+" : "10–18"} days. Full refund if it never arrives.</span>
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--st-muted)]">{product.description}</p>
        {product.specs.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-[var(--st-line)] pt-4 text-[14px]">
            {product.specs.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-[var(--st-muted)]">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
