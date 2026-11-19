"use client";

import { ChevronLeft, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { ProductIcon } from "@/components/ui/product-icon";
import type { IconKey, Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { searchCatalog } from "../actions";

const DISCOVER = ["Necklace for men", "Watch for men", "Bone straight wig", "Android phone", "Chain", "Office chair", "Party dress", "Lipstick", "Sneakers"];
const HOT: [string, string, IconKey, string][] = [
  ["TOP 1", "Lace front wigs", "wig", "#F3E9DC"], ["TOP 1", "Men quartz watches", "watch", "#E3EEE8"], ["TOP 2", "Press-on nails", "lipstick", "#F8E1E7"],
  ["TOP 1", "Android phones", "phone", "#E8E8F0"], ["TOP 3", "Satin dresses", "dress", "#F6E3E6"], ["TOP 1", "Wireless earbuds", "audio", "#E7E6F3"],
  ["TOP 4", "Chain necklaces", "gem", "#ECECEC"], ["TOP 1", "Matte lipstick", "lipstick", "#F8E1E7"], ["TOP 2", "Office chairs", "chair", "#ECECEC"],
];
const SORTS = ["Relevance", "Best selling", "Price ↑", "Price ↓", "Air only"] as const;

/** Browser fallback used when the database isn't connected. */
function localMatch(products: Product[], q: string) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  return products.filter((p) => words.some((w) => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(w.replace(/s$/, ""))));
}

function sortResults(matches: Product[], sort: (typeof SORTS)[number]) {
  let res = matches;
  if (sort === "Best selling") res = [...res].sort((a, b) => b.sold - a.sold);
  if (sort === "Price ↑") res = [...res].sort((a, b) => a.prices.list - b.prices.list);
  if (sort === "Price ↓") res = [...res].sort((a, b) => b.prices.list - a.prices.list);
  if (sort === "Air only") res = res.filter((p) => p.shipMode === "air");
  return res;
}

export function SearchView({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [recent, setRecent] = useState(["Silver necklace", "Lace wig", "Earbuds", "Phone case"]);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Relevance");
  const term = q.trim();
  // Ranked slugs from the database (typo-tolerant). Debounced so typing doesn't flood the server.
  const [ranked, setRanked] = useState<{ term: string; slugs: string[] | null } | null>(null);
  useEffect(() => {
    if (term.length < 2) return;
    let stale = false;
    const t = setTimeout(async () => {
      const slugs = await searchCatalog(term).catch(() => null);
      if (!stale) setRanked({ term, slugs });
    }, 220);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [term]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const fromDb = ranked && ranked.term === term && ranked.slugs ? ranked.slugs.flatMap((s) => bySlug.get(s) ?? []) : null;
  const results = term ? sortResults(fromDb ?? localMatch(products, term), sort) : [];

  const go = (v: string) => {
    setQ(v);
    router.replace(v ? `/search?q=${encodeURIComponent(v)}` : "/search", { scroll: false });
  };

  return (
    <div className="flex flex-col pb-6">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="sticky top-0 z-20 flex items-center gap-1.5 border-b border-line bg-white px-3 py-2.5 md:static md:border-0 md:px-0 md:pt-6"
      >
        <Link href="/" aria-label="Back" className="flex h-11 w-9 items-center justify-center md:hidden">
          <ChevronLeft aria-hidden size={22} />
        </Link>
        <div className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-md border-2 border-ink">
          <label htmlFor="sq" className="sr-only">Search FastChina</label>
          <input
            id="sq"
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search phones, wigs, dresses…"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[15px] outline-none"
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => go("")} className="flex h-full w-9 items-center justify-center text-subtle">
              <X aria-hidden size={18} />
            </button>
          )}
          <button type="submit" aria-label="Search" className="flex h-full w-12 items-center justify-center bg-ink text-white">
            <Search aria-hidden size={18} />
          </button>
        </div>
      </form>

      {!term ? (
        <div className="flex flex-col gap-5 px-3 pt-3.5 md:grid md:grid-cols-[1fr_1.4fr] md:gap-10 md:px-0">
          <div className="flex flex-col gap-5">
            {recent.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold">Recent searches</h2>
                  <button type="button" aria-label="Clear recent searches" onClick={() => setRecent([])} className="flex size-10 items-center justify-center text-muted">
                    <Trash2 aria-hidden size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button key={r} type="button" onClick={() => go(r)} className="min-h-[38px] bg-surface px-3.5 text-sm text-[#333]">
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2.5">
              <h2 className="text-base font-extrabold">Search discovery</h2>
              <div className="flex flex-wrap gap-2">
                {DISCOVER.map((r) => (
                  <button key={r} type="button" onClick={() => go(r)} className="min-h-[38px] bg-surface px-3.5 text-sm text-[#333]">
                    {r}
                  </button>
                ))}
              </div>
            </section>
          </div>
          <section className="flex flex-col gap-2.5">
            <h2 className="flex items-center gap-1.5 text-base font-extrabold">
              <span className="rounded-sm bg-[#F5DE9A] px-1.5 py-0.5 text-[11px] text-gold-ink">HOT</span>
              FastChina Hot List
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {HOT.map(([rank, cat, icon, tint]) => (
                <button key={cat} type="button" onClick={() => go(cat)} className="flex flex-col overflow-hidden rounded-md bg-[#fafafa]">
                  <span className="relative flex h-[104px] w-full items-center justify-center md:h-36" style={{ background: tint }}>
                    <ProductIcon icon={icon} size={44} className="text-ink/55" />
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-[#FFF6DA] px-2 py-0.5 text-[11px] font-extrabold text-gold-ink">{rank}</span>
                  </span>
                  <span className="p-1.5 text-center text-[11px] leading-tight text-gold-ink">in {cat}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5 md:px-0">
            {SORTS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sort === s}
                onClick={() => setSort(s)}
                className={cn("min-h-9 whitespace-nowrap rounded-full border px-3 text-[13px] font-bold", sort === s ? "border-ink bg-ink text-white" : "border-black/15")}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="px-3 py-2 text-muted md:px-0">
            {results.length} result{results.length === 1 ? "" : "s"} for “{term}”
          </p>
          {results.length ? (
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 px-1.5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:px-0 lg:grid-cols-5">
              {results.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <strong className="text-[15px]">Not on FastChina yet</strong>
              <span className="leading-relaxed text-muted">Tell our team what you’re looking for and we’ll find it for you.</span>
              <Link href="/account/settings/contact" className="bg-ink px-4 py-3 font-extrabold text-white">
                REQUEST THIS PRODUCT
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
