"use client";

import { Check, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/shop/cart-provider";
import { ProductTile } from "@/components/shop/product-card";
import type { Product } from "@/lib/catalog/types";
import { cn, naira } from "@/lib/format";
import { PRICING } from "@/lib/pricing/config";

const MIN = PRICING.retailerMinQty;

function WholesaleCard({ product }: { product: Product }) {
  const { add } = useCart();
  const single = product.variants.length === 1 ? product.variants[0] : null;
  const [qty, setQty] = useState<number>(MIN);
  const [added, setAdded] = useState(false);
  const unit = product.prices.retailer;
  const saving = (product.prices.list - unit) * MIN;
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-md border border-line bg-white p-2 md:p-2.5">
      <Link href={`/product/${product.slug}`} className="flex flex-col gap-1.5">
        <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={product.images[0]} className="aspect-square w-full" iconSize={48} sizes="(min-width: 1024px) 200px, 45vw" />
        <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] leading-snug">{product.name}</h3>
      </Link>
      <div className="flex flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <strong className="text-[16px] tabular-nums">{naira(unit)}</strong>
          <span className="text-[11px] text-muted">each at {MIN}+</span>
        </span>
        <span className="text-[11px] text-muted">
          1–{MIN - 1}: <s className="tabular-nums">{naira(product.prices.list)}</s>
          {saving > 0 && <span className="font-bold text-success"> · save {naira(saving)} on {MIN}</span>}
        </span>
      </div>
      {single ? (
        <div className="mt-auto flex items-center gap-1.5">
          <span className="flex items-center rounded-full border border-line">
            <button type="button" aria-label="Fewer" onClick={() => setQty((q) => Math.max(MIN, q - 1))} className="flex size-8 items-center justify-center"><Minus aria-hidden size={13} /></button>
            <span aria-live="polite" className="w-7 text-center text-[13px] font-bold tabular-nums">{qty}</span>
            <button type="button" aria-label="More" onClick={() => setQty((q) => Math.min(999, q + 1))} className="flex size-8 items-center justify-center"><Plus aria-hidden size={13} /></button>
          </span>
          <button
            type="button"
            onClick={() => {
              add(product, single, qty, single.prices.retailer);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            className={cn("flex min-h-8 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-bold", added ? "bg-success text-white" : "bg-ink text-white")}
          >
            {added ? <><Check aria-hidden size={13} /> Added</> : "Add"}
          </button>
        </div>
      ) : (
        <Link href={`/product/${product.slug}`} className="mt-auto flex min-h-8 items-center justify-center rounded-full border border-ink text-[12px] font-bold">
          Choose {product.options.map((o) => o.name.toLowerCase()).join(" & ") || "options"}
        </Link>
      )}
    </article>
  );
}

export function WholesaleGrid({ products, categories }: { products: Product[]; categories: { key: string; name: string }[] }) {
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"saving" | "price" | "popular">("saving");
  const list = useMemo(() => {
    const l = products.filter((p) => cat === "all" || p.category === cat);
    if (sort === "price") return [...l].sort((a, b) => a.prices.retailer - b.prices.retailer);
    if (sort === "popular") return [...l].sort((a, b) => b.sold - a.sold);
    return [...l].sort((a, b) => b.prices.list - b.prices.retailer - (a.prices.list - a.prices.retailer));
  }, [products, cat, sort]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Category" className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
          {[{ key: "all", name: "All" }, ...categories].map((c) => (
            <button key={c.key} type="button" role="radio" aria-checked={cat === c.key} onClick={() => setCat(c.key)} className={cn("min-h-9 shrink-0 rounded-full border px-3.5 text-[12px] font-bold", cat === c.key ? "border-ink bg-ink text-white" : "border-line bg-white")}>
              {c.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-muted">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="min-h-9 rounded-md border border-line bg-white px-2 font-bold text-ink">
            <option value="saving">Biggest saving</option>
            <option value="price">Lowest price</option>
            <option value="popular">Best selling</option>
          </select>
        </label>
      </div>
      <p className="text-[12px] text-muted" aria-live="polite">{list.length} products</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 md:gap-2.5 lg:grid-cols-5 xl:grid-cols-6">
        {list.map((p) => <WholesaleCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
