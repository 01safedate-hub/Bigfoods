"use client";

import { ProductTrustNote } from "@/components/shop/product-trust";
import { ArrowRight, Check, ChevronLeft, Ship } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductTile } from "@/components/shop/product-card";
import type { Product } from "@/lib/catalog/types";
import { cn, naira } from "@/lib/format";
import { MIN_QTY, SEA_DAYS } from "@/lib/wholesale/rules";
import { MixRows, MixStatus, useMix } from "../../mix";

/**
 * The wholesale version of a product page. Everything here follows the wholesale rules, so it can't be
 * mixed up with a single-item purchase: wholesale prices only, at least MIN_QTY units of the product
 * (any mix of colours and sizes), sea shipping only, and it goes into the wholesale cart.
 */
export function WholesaleProductView({ product }: { product: Product }) {
  const mix = useMix(product);
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const photos = product.images.length ? product.images : [null];
  const save = Math.round((1 - product.wholesaleFrom / product.prices.list) * 100);
  const changed = mix.total !== mix.inCart;

  const commit = () => {
    if (!mix.ok) return;
    mix.save();
    setSaved(true);
  };
  const cta = !mix.ok ? `Add ${MIN_QTY - mix.total} more to reach ${MIN_QTY}` : saved && !changed ? "In your wholesale cart" : mix.inCart ? "Update wholesale cart" : "Add to wholesale cart";

  return (
    <div className="flex flex-col gap-3 bg-surface pb-32 md:grid md:grid-cols-[1.1fr_1fr] md:gap-10 md:bg-transparent md:pt-6 md:pb-10">
      {/* Phones: a clear way back to the market, in wholesale red. */}
      <Link href="/wholesale" className="flex items-center gap-1 bg-sale px-2 py-2.5 text-[13px] font-extrabold text-white md:hidden">
        <ChevronLeft aria-hidden size={18} /> Wholesale market
      </Link>

      <div className="flex min-w-0 flex-col gap-2 md:sticky md:top-32 md:self-start">
        <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={photos[photo] ?? undefined} priority sizes="(min-width: 768px) 45vw, 100vw" className="aspect-square w-full rounded-none md:aspect-[4/5] md:rounded-md" iconSize={140} />
        {photos.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 md:px-0">
            {photos.map((src, i) => (
              <button key={src ?? i} type="button" aria-label={`Photo ${i + 1} of ${photos.length}`} aria-pressed={photo === i} onClick={() => setPhoto(i)} className={cn("shrink-0 rounded-md ring-2", photo === i ? "ring-sale" : "ring-transparent")}>
                <ProductTile tint={product.tint} icon={product.icon} name="" image={src ?? undefined} className="size-16 rounded-md" iconSize={24} sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <section className="flex flex-col gap-2 bg-white p-3 md:p-0">
          <Link href="/wholesale" className="hidden w-fit items-center gap-1 text-[13px] font-bold text-sale md:flex"><ChevronLeft aria-hidden size={16} /> Wholesale market</Link>
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-sale px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] text-white"><Ship aria-hidden size={13} /> WHOLESALE · SEA ONLY</span>
          <h1 className="text-[20px] font-extrabold leading-snug md:text-[28px]">{product.name}</h1>
          {product.customisable && <span className="w-fit rounded-sm bg-[#FFF1D6] px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[#8A5A00]">CUSTOMISABLE · ADD YOUR LOGO</span>}
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-[26px] tabular-nums text-sale">{naira(product.wholesaleFrom)}</strong>
            <span className="text-[13px] text-muted">/unit{product.variants.filter((v) => v.wholesale > 0).length > 1 ? " and up" : ""}</span>
            {save > 0 && <span className="rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[12px] font-extrabold text-sale">−{save}% vs single price</span>}
          </span>
        </section>

        {/* The rules, stated once, plainly. */}
        <section aria-label="How wholesale works" className="mx-3 grid grid-cols-3 gap-2 rounded-xl border border-sale/30 bg-[#FFF5F5] p-3 text-center text-[12px] leading-tight md:mx-0">
          <span className="flex flex-col gap-0.5"><strong className="text-[18px] text-sale">{MIN_QTY}+</strong>units minimum<br />mix any options</span>
          <span className="flex flex-col gap-0.5"><strong className="text-[18px] text-sale">Sea</strong>shipping only<br />no air option</span>
          <span className="flex flex-col gap-0.5"><strong className="text-[18px] text-sale">{SEA_DAYS[0]}–{SEA_DAYS[1]}</strong>days to arrive<br />after full payment</span>
        </section>

        <section className="flex flex-col gap-2 bg-white p-3 md:rounded-xl md:border md:border-line">
          <h2 className="text-[15px] font-extrabold">How many?</h2>
          <p className="text-[13px] text-muted">Mix colours and sizes however you like. You need at least {MIN_QTY} units of this product in total.</p>
          <MixRows mix={mix} />
          <MixStatus mix={mix} />
          {/* Desktop button; phones use the bar at the bottom. */}
          <button type="button" disabled={!mix.ok || (saved && !changed)} onClick={commit} className="hidden min-h-12 items-center justify-center gap-2 rounded-full bg-sale text-[15px] font-extrabold text-white disabled:opacity-40 md:flex">
            {saved && !changed && <Check aria-hidden size={18} />} {cta}
          </button>
          {(saved || mix.inCart > 0) && (
            <Link href="/wholesale/cart" className="flex items-center justify-center gap-1 text-[14px] font-bold text-sale underline underline-offset-4">
              View wholesale cart <ArrowRight aria-hidden size={14} />
            </Link>
          )}
        </section>

        <div className="mx-3 md:mx-0">
          <ProductTrustNote customisable={product.customisable} />
        </div>

        <p className="mx-3 rounded-xl bg-white p-3 text-[13px] text-muted md:mx-0 md:border md:border-line">
          Wholesale orders don’t use coupons, points or sales. Delivery inside Nigeria is arranged after customs and billed by state.
          {" "}Only need one or two? <Link href={`/product/${product.slug}`} className="font-bold text-ink underline underline-offset-4">Buy single at {naira(product.prices.list)}</Link>, delivered by air.
        </p>

        <section className="bg-white p-3 md:p-0">
          <h2 className="mb-1.5 text-sm font-extrabold">Details</h2>
          <p className="mb-2 leading-relaxed text-[#333]">{product.description}</p>
          {product.specs.length > 0 && (
            <dl className="grid grid-cols-2 border-t border-line">
              {product.specs.map(([k, v]) => (
                <div key={k} className="border-b border-line py-2 pr-2">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="break-words font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      {/* Phones: units, total and the button, always within reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white px-3 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden">
        <span className="flex min-w-0 flex-col leading-tight">
          <strong className={cn("text-[16px] tabular-nums", mix.ok ? "text-ink" : "text-sale")}>{mix.total} / {MIN_QTY}+ units</strong>
          <span className="truncate text-[12px] text-muted">{mix.ok ? naira(mix.cost) : "Minimum not reached yet"} · by sea</span>
        </span>
        <button type="button" disabled={!mix.ok || (saved && !changed)} onClick={commit} className="ml-auto flex min-h-12 shrink-0 items-center gap-1.5 rounded-full bg-sale px-5 text-[14px] font-extrabold text-white disabled:opacity-50">
          {saved && !changed && <Check aria-hidden size={16} />} {mix.ok ? cta : `Add ${MIN_QTY - mix.total} more`}
        </button>
      </div>
    </div>
  );
}
