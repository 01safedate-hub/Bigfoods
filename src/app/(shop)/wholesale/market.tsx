"use client";

import { ArrowRight, Check, Minus, PackagePlus, Plus, Search, Ship, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ProductTile } from "@/components/shop/product-card";
import type { Product, Variant } from "@/lib/catalog/types";
import { CATEGORY_PAGES } from "@/lib/content/category-pages";
import { cn, naira } from "@/lib/format";
import type { CategoryKey } from "@/lib/pricing/engine";
import { useWholesaleCart, wcart } from "@/lib/wholesale/cart";
import { type Kit, kitLines, matches, MIN_QTY } from "@/lib/wholesale/rules";

type Sort = "best" | "low" | "high" | "saving";
const TONES: Record<Kit["tone"], string> = {
  red: "bg-gradient-to-br from-[#E11D2E] to-[#9F0F1C] text-white",
  black: "bg-gradient-to-br from-[#26262B] to-[#0B0B0D] text-white",
  pink: "bg-gradient-to-br from-[#F472B6] to-[#BE185D] text-white",
  gold: "bg-gradient-to-br from-[#F3D98B] to-[#C9982E] text-[#3B2A06]",
  green: "bg-gradient-to-br from-[#22A06B] to-[#0B5E3B] text-white",
  blue: "bg-gradient-to-br from-[#3B82F6] to-[#1E3A8A] text-white",
};
const RANGES = [[0, 10_000], [10_000, 50_000], [50_000, 200_000], [200_000, Infinity]] as const;
const catName = (k: string) => CATEGORY_PAGES[k as CategoryKey]?.name ?? k;
const rangeLabel = ([a, b]: readonly [number, number]) => (b === Infinity ? `Over ${naira(a)}` : a === 0 ? `Under ${naira(b)}` : `${naira(a)}–${naira(b)}`);

export function WholesaleMarket({ products, categories, kits }: { products: Product[]; categories: CategoryKey[]; kits: Kit[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "all");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) || "best");
  const [focus, setFocus] = useState(false);
  const [filters, setFilters] = useState(false);
  const [sheet, setSheet] = useState<Product | null>(null);
  const dq = useDeferredValue(q);
  const cart = useWholesaleCart();

  // Keep the URL in step so a search can be shared or bookmarked.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (dq) sp.set("q", dq);
    if (cat !== "all") sp.set("cat", cat);
    if (min) sp.set("min", min);
    if (max) sp.set("max", max);
    if (sort !== "best") sp.set("sort", sort);
    const next = sp.toString();
    if (next !== params.toString()) router.replace(next ? `${path}?${next}` : path, { scroll: false });
  }, [dq, cat, min, max, sort, path, params, router]);

  const lo = Number(min) || 0;
  const hi = Number(max) || Infinity;
  const results = useMemo(() => {
    const l = products.filter((p) => (cat === "all" || p.category === cat) && p.wholesaleFrom >= lo && p.wholesaleFrom <= hi && matches(p, dq, catName(p.category)));
    const by: Record<Sort, (a: Product, b: Product) => number> = {
      best: (a, b) => b.sold - a.sold,
      low: (a, b) => a.wholesaleFrom - b.wholesaleFrom,
      high: (a, b) => b.wholesaleFrom - a.wholesaleFrom,
      saving: (a, b) => b.prices.list - b.wholesaleFrom - (a.prices.list - a.wholesaleFrom),
    };
    return l.sort(by[sort]);
  }, [products, cat, lo, hi, dq, sort]);

  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return { cats: [] as CategoryKey[], items: [] as Product[] };
    return {
      cats: categories.filter((c) => catName(c).toLowerCase().includes(t)).slice(0, 3),
      items: products.filter((p) => matches(p, t, catName(p.category))).sort((a, b) => b.sold - a.sold).slice(0, 6),
    };
  }, [q, categories, products]);

  const filtered = Boolean(dq || cat !== "all" || min || max);
  const units = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.unit, 0);

  return (
    <div className="flex flex-col gap-5 pb-28 md:pb-10">
      {/* Search, wholesale items only */}
      <div className="sticky top-[41px] z-20 -mx-0 flex flex-col gap-2 bg-white px-3 py-2.5 shadow-[0_8px_16px_-14px_rgba(0,0,0,0.4)] md:top-[105px] md:rounded-xl md:px-4">
        <form role="search" onSubmit={(e) => { e.preventDefault(); setFocus(false); (document.activeElement as HTMLElement | null)?.blur(); }} className="relative flex gap-2">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search aria-hidden size={17} className="pointer-events-none absolute left-3.5 text-sale" />
            <span className="sr-only">Search the wholesale market</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              placeholder="Search wholesale: wigs, phones, sneakers…"
              className="h-11 w-full rounded-full border-2 border-sale bg-white pr-4 pl-10 text-[15px] outline-none"
            />
          </label>
          <button type="button" onClick={() => setFilters(!filters)} aria-expanded={filters} aria-label="Filters" className={cn("flex size-11 shrink-0 items-center justify-center rounded-full border", filters || min || max ? "border-sale bg-sale text-white" : "border-line")}>
            <SlidersHorizontal aria-hidden size={18} />
          </button>
          {focus && (suggestions.items.length > 0 || suggestions.cats.length > 0) && (
            <div role="listbox" aria-label="Suggestions" className="absolute inset-x-0 top-12 z-30 flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xl">
              {suggestions.cats.map((c) => (
                <button key={c} type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => { setCat(c); setQ(""); setFocus(false); }} className="flex items-center justify-between gap-2 px-4 py-2.5 text-left text-[14px] hover:bg-surface">
                  <span>All <strong>{catName(c)}</strong></span><span className="text-[12px] text-muted">Category</span>
                </button>
              ))}
              {suggestions.items.map((p) => (
                <button key={p.slug} type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(p.name); setFocus(false); }} className="flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-surface">
                  <span className="truncate">{p.name}</span><span className="shrink-0 text-[12px] font-bold text-sale">{naira(p.wholesaleFrom)}</span>
                </button>
              ))}
            </div>
          )}
        </form>
        <div role="radiogroup" aria-label="Category" className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 md:mx-0 md:px-0">
          {(["all", ...categories] as string[]).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)} className={cn("min-h-8 shrink-0 rounded-full border px-3 text-[12px] font-bold", cat === c ? "border-sale bg-sale text-white" : "border-line bg-white")}>
              {c === "all" ? "All" : catName(c)}
            </button>
          ))}
        </div>
        {filters && (
          <div className="flex flex-col gap-2.5 border-t border-line pt-2.5">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="font-bold">Price per unit</span>
              <input aria-label="Minimum price" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min ₦" className="h-9 w-24 rounded-lg border border-line px-2.5" />
              <span>–</span>
              <input aria-label="Maximum price" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max ₦" className="h-9 w-24 rounded-lg border border-line px-2.5" />
              {(min || max) && <button type="button" onClick={() => { setMin(""); setMax(""); }} className="text-[12px] font-bold underline">Clear</button>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RANGES.map((r) => (
                <button key={r[0]} type="button" onClick={() => { setMin(r[0] ? String(r[0]) : ""); setMax(r[1] === Infinity ? "" : String(r[1])); }} className="min-h-8 rounded-full bg-surface px-3 text-[12px] font-semibold">{rangeLabel(r)}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Starter kits */}
      {!filtered && kits.length > 0 && (
        <section aria-labelledby="kits-h" className="flex flex-col gap-2.5">
          <div className="flex items-end justify-between gap-2 px-3 md:px-0">
            <h2 id="kits-h" className="text-[16px] font-extrabold md:text-[20px]">Starter kits</h2>
          </div>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 md:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {kits.map((k) => <KitCard key={k.slug} kit={k} products={products} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="grid-h" className="flex flex-col gap-2.5 px-3 md:px-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="grid-h" className="text-[16px] font-extrabold md:text-[20px]">
            {dq ? `“${dq}” in wholesale` : cat !== "all" ? `${catName(cat)} wholesale` : "All wholesale products"}
            <span className="ml-2 text-[13px] font-semibold text-muted" aria-live="polite">{results.length}</span>
          </h2>
          <label className="flex items-center gap-1.5 text-[12px] text-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-lg border border-line bg-white px-2 font-bold text-ink">
              <option value="best">Best selling</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="saving">Biggest saving</option>
            </select>
          </label>
        </div>
        {results.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {results.map((p) => <WholesaleCard key={p.slug} product={p} onChoose={() => setSheet(p)} inCart={cart.filter((l) => l.slug === p.slug).reduce((s, l) => s + l.qty, 0)} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-surface px-4 py-10 text-center">
            <strong className="text-[15px]">Nothing in wholesale matches that</strong>
            <span className="text-[13px] text-muted">Try another word, clear the price filter, or ask us to source it for you.</span>
            <button type="button" onClick={() => { setQ(""); setCat("all"); setMin(""); setMax(""); }} className="mt-1 min-h-10 rounded-full bg-ink px-5 text-[13px] font-bold text-white">Clear search</button>
          </div>
        )}
      </section>

      {sheet && <VariantSheet product={sheet} onClose={() => setSheet(null)} />}

      {units > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(49px+env(safe-area-inset-bottom))] z-30 px-3 pb-2 md:bottom-4 md:mx-auto md:max-w-xl">
          <Link href="/wholesale/cart" className="flex items-center justify-between gap-3 rounded-2xl bg-sale px-4 py-3 text-white shadow-2xl">
            <span className="flex flex-col leading-tight">
              <strong className="text-[15px]">Wholesale cart · {units} units</strong>
              <span className="text-[12px] text-white/85">{naira(total)} · by sea, 90+ days</span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-sale">View cart <ArrowRight aria-hidden size={14} /></span>
          </Link>
        </div>
      )}
    </div>
  );
}

function WholesaleCard({ product, onChoose, inCart }: { product: Product; onChoose: () => void; inCart: number }) {
  const single = product.variants.length === 1 ? product.variants[0] : null;
  const save = Math.round((1 - product.wholesaleFrom / product.prices.list) * 100);
  const [added, setAdded] = useState(false);
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white">
      <Link href={`/product/${product.slug}`} className="relative">
        <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={product.images[0]} className="aspect-square w-full rounded-none" iconSize={48} sizes="(min-width: 1024px) 220px, 45vw" />
        {save > 0 && <span className="absolute left-0 top-2 rounded-r-full bg-sale px-2 py-0.5 text-[11px] font-extrabold text-white">−{save}% vs single</span>}
        {inCart > 0 && <span className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">{inCart} in cart</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] leading-snug">{product.name}</h3>
        <span className="flex items-baseline gap-1">
          <strong className="text-[17px] tabular-nums text-sale">{naira(product.wholesaleFrom)}</strong>
          <span className="text-[11px] text-muted">/unit</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted"><Ship aria-hidden size={12} /> Min {MIN_QTY} · sea 90+ days</span>
        <button
          type="button"
          onClick={() => {
            if (!single) return onChoose();
            wcart.add(product, single, MIN_QTY);
            setAdded(true);
            setTimeout(() => setAdded(false), 1300);
          }}
          className={cn("mt-auto flex min-h-9 items-center justify-center gap-1 rounded-full text-[12px] font-extrabold", added ? "bg-success text-white" : single ? "bg-sale text-white" : "border-[1.5px] border-sale text-sale")}
        >
          {added ? <><Check aria-hidden size={14} /> Added {MIN_QTY}</> : single ? <><Plus aria-hidden size={14} /> Add {MIN_QTY}</> : `Choose ${product.options.map((o) => o.name.toLowerCase()).join(" & ") || "options"}`}
        </button>
      </div>
    </article>
  );
}

function KitCard({ kit, products }: { kit: Kit; products: Product[] }) {
  const lines = useMemo(() => kitLines(kit, products), [kit, products]);
  const [added, setAdded] = useState(false);
  if (!lines.length) return null;
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.variant.wholesale, 0);
  return (
    <article className={cn("flex w-[78%] shrink-0 snap-start flex-col gap-3 rounded-2xl p-4 sm:w-[44%] md:w-[31%] lg:w-auto", TONES[kit.tone])}>
      <span className="flex flex-col gap-1">
        <span className="text-[11px] font-extrabold tracking-[0.14em] opacity-80">STARTER KIT</span>
        <h3 className="text-[19px] font-extrabold leading-tight">{kit.title}</h3>
        <p className="text-[13px] leading-snug opacity-85">{kit.subtitle}</p>
      </span>
      <ul className="flex -space-x-2" aria-label="Products in this kit">
        {lines.slice(0, 5).map((l) => (
          <li key={l.product.slug} className="size-11 overflow-hidden rounded-full border-2 border-white/80">
            <ProductTile tint={l.product.tint} icon={l.product.icon} name={l.product.name} image={l.product.images[0]} className="size-full rounded-none" iconSize={20} sizes="44px" />
          </li>
        ))}
        {lines.length > 5 && <li className="flex size-11 items-center justify-center rounded-full border-2 border-white/80 bg-black/25 text-[12px] font-bold">+{lines.length - 5}</li>}
      </ul>
      <span className="text-[13px] font-semibold opacity-90">{lines.length} products · {units} units · <strong className="text-[15px]">{naira(total)}</strong></span>
      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={() => {
            wcart.addMany(lines);
            setAdded(true);
          }}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-extrabold text-ink"
        >
          {added ? <><Check aria-hidden size={15} /> Added</> : <><PackagePlus aria-hidden size={16} /> Add all to cart</>}
        </button>
        {added && <Link href="/wholesale/cart" className="flex min-h-11 items-center rounded-full border border-current px-4 text-[13px] font-bold">Edit</Link>}
      </div>
    </article>
  );
}

/** Pick quantities per colour/size; the product needs at least MIN_QTY units in total. */
function VariantSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cart = useWholesaleCart();
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(cart.filter((l) => l.slug === product.slug).map((l) => [l.variantId, l.qty])));
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const total = Object.values(qty).reduce((s, n) => s + n, 0);
  const cost = product.variants.reduce((s, v) => s + (qty[v.id] ?? 0) * v.wholesale, 0);
  const set = (v: Variant, n: number) => setQty((q) => ({ ...q, [v.id]: Math.max(0, Math.min(9999, n)) }));
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="vs-h" className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-ink backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:rounded-3xl">
      <div className="flex flex-col gap-3 p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <h2 id="vs-h" className="text-[17px] font-extrabold leading-snug">{product.name}</h2>
            <span className="text-[13px] text-muted">Mix any colours and sizes. At least {MIN_QTY} in total.</span>
          </span>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface"><X aria-hidden size={18} /></button>
        </div>
        <ul className="flex flex-col divide-y divide-line">
          {product.variants.filter((v) => v.wholesale > 0).map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-[14px]">{Object.values(v.props).join(" / ") || "Standard"}</strong>
                <span className="text-[12px] text-muted">{naira(v.wholesale)}/unit{v.stock < 1 ? " · out of stock" : ""}</span>
              </span>
              <span className="flex items-center rounded-full border border-line">
                <button type="button" aria-label="Fewer" disabled={!qty[v.id]} onClick={() => set(v, (qty[v.id] ?? 0) - 1)} className="flex size-9 items-center justify-center disabled:opacity-30"><Minus aria-hidden size={14} /></button>
                <input aria-label={`Units of ${Object.values(v.props).join(" ") || "this"}`} inputMode="numeric" value={qty[v.id] ?? 0} onChange={(e) => set(v, Number(e.target.value.replace(/\D/g, "")) || 0)} className="w-11 text-center text-[14px] font-bold tabular-nums outline-none" />
                <button type="button" aria-label="More" disabled={v.stock < 1} onClick={() => set(v, (qty[v.id] ?? 0) + (qty[v.id] ? 1 : 5))} className="flex size-9 items-center justify-center disabled:opacity-30"><Plus aria-hidden size={14} /></button>
              </span>
            </li>
          ))}
        </ul>
        <p className={cn("rounded-lg px-3 py-2 text-[13px] font-semibold", total >= MIN_QTY ? "bg-success-soft text-success" : "bg-[#FFF1F2] text-sale")}>
          {total >= MIN_QTY ? `${total} units · ${naira(cost)}` : `${total} of ${MIN_QTY} units: add ${MIN_QTY - total} more`}
        </p>
        <button
          type="button"
          disabled={total < MIN_QTY}
          onClick={() => {
            for (const v of product.variants) wcart.add(product, v, qty[v.id] ?? 0, true);
            ref.current?.close();
          }}
          className="min-h-12 rounded-full bg-sale text-[15px] font-extrabold text-white disabled:opacity-40"
        >
          Save to wholesale cart
        </button>
      </div>
    </dialog>
  );
}
