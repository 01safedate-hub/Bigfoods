"use client";

import { Check, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ProductTile } from "@/components/shop/product-card";
import type { Product } from "@/lib/catalog/types";
import { type PlanKey, PLANS, sellerNet, storePrice } from "@/lib/dropship/plans";
import { cn } from "@/lib/format";
import { call } from "@/lib/net";
import { type MyListing, removeListing, saveListing } from "../actions";
import { btn, ngn } from "../_ui/ui";

const DEFAULT_MARKUP = 25;

export function ProductsManager({ catalog, listings: initial, plan }: { catalog: Product[]; listings: MyListing[]; plan: PlanKey }) {
  const [tab, setTab] = useState<"mine" | "add">(initial.length ? "mine" : "add");
  const [listings, setListings] = useState(initial);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const rules = PLANS[plan];
  const live = listings.filter((l) => l.active).length;
  const full = live >= rules.maxProducts;
  const bySlug = useMemo(() => new Map(catalog.map((p) => [p.slug, p])), [catalog]);
  const mine = new Set(listings.map((l) => l.slug));
  const cats = ["all", ...new Set(catalog.map((p) => p.category))];
  const shown = catalog.filter((p) => !mine.has(p.slug) && (cat === "all" || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));

  const save = (l: MyListing, note = "Saved") =>
    start(async () => {
      setBusy(l.slug);
      const r = await call(() => saveListing(l.slug, l.markupType, l.markupValue, l.active));
      setBusy(null);
      setMsg({ ok: r.ok, text: r.ok ? note : r.message });
      if (r.ok) setListings((all) => (all.some((x) => x.slug === l.slug) ? all.map((x) => (x.slug === l.slug ? l : x)) : [l, ...all]));
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex rounded-full bg-[#17171A] p-1">
          {([["mine", `In your store · ${live}`], ["add", "Add products"]] as const).map(([k, label]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("min-h-10 rounded-full px-4 text-[13px] font-bold", tab === k ? "bg-white text-black" : "text-[#A1A1AA] hover:text-white")}>{label}</button>
          ))}
        </div>
        <span className={cn("text-[13px] font-semibold", full ? "text-[#FF8A8A]" : "text-[#A1A1AA]")}>
          {rules.maxProducts >= 100_000 ? `${live} live` : `${live} of ${rules.maxProducts} used`}
          {full && <> · <Link href="/store/seller/plan" className="underline">Upgrade for more</Link></>}
        </span>
      </div>
      {msg && <p role="status" className={cn("text-[13px] font-semibold", msg.ok ? "text-[#3DDC84]" : "text-[#FF8A8A]")}>{msg.text}</p>}

      {tab === "mine" && (
        <div className="flex flex-col gap-2">
          {listings.length === 0 && <p className="rounded-xl bg-[#17171A] p-8 text-center text-[#8A8A93]">No products yet. Go to “Add products” and pick a few bestsellers.</p>}
          {listings.map((l) => {
            const p = bySlug.get(l.slug);
            if (!p) return null;
            const { price, markup } = storePrice(p.prices.list, l.markupType, l.markupValue);
            return (
              <div key={l.slug} className={cn("grid grid-cols-[56px_1fr] items-center gap-3 rounded-xl bg-[#17171A] p-3 md:grid-cols-[56px_1.4fr_1.4fr_1fr_auto]", !l.active && "opacity-50")}>
                <ProductTile tint={p.tint} icon={p.icon} name={p.name} image={p.images[0]} className="size-14 rounded-md" iconSize={26} sizes="56px" />
                <span className="min-w-0">
                  <strong className="block truncate text-[14px]">{p.name}</strong>
                  <span className="text-[12px] text-[#8A8A93]">FastChina price {ngn(p.prices.list)}</span>
                </span>
                <MarkupEditor listing={l} onChange={(next) => setListings((all) => all.map((x) => (x.slug === l.slug ? next : x)))} onCommit={(next) => save(next)} />
                <span className="col-span-2 flex items-baseline justify-between gap-2 md:col-span-1 md:flex-col md:items-end">
                  <span className="text-[16px] font-black tabular-nums">{ngn(price)}</span>
                  <span className="text-[12px] font-bold text-[#3DDC84]">You keep {ngn(sellerNet(markup, plan))}</span>
                </span>
                <span className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
                  <button type="button" role="switch" aria-checked={l.active} aria-label={l.active ? "Live in your store" : "Hidden"} disabled={busy === l.slug}
                    onClick={() => save({ ...l, active: !l.active }, l.active ? "Hidden from your store" : "Live in your store")}
                    className={cn("flex h-7 w-12 rounded-full p-1", l.active ? "justify-end bg-[#3DDC84]" : "justify-start bg-[#3A3A40]")}>
                    <span className="size-5 rounded-full bg-white" />
                  </button>
                  <button type="button" aria-label={`Remove ${p.name}`} className="flex size-10 items-center justify-center rounded-full text-[#8A8A93] hover:bg-white/10 hover:text-white"
                    onClick={() => start(async () => {
                      const r = await call(() => removeListing(l.slug));
                      setMsg({ ok: r.ok, text: r.message });
                      if (r.ok) setListings((all) => all.filter((x) => x.slug !== l.slug));
                    })}>
                    <Trash2 aria-hidden size={17} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {tab === "add" && (
        <>
          <div className="flex flex-col gap-2 md:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search the catalogue</span>
              <Search aria-hidden size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B73]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dresses, wigs, phones…" className={cn(btn.input, "pl-9")} />
            </label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {cats.map((c) => (
                <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
                  className={cn("min-h-11 shrink-0 rounded-full px-4 text-[13px] font-bold capitalize", cat === c ? "bg-white text-black" : "bg-[#17171A] text-[#A1A1AA] hover:text-white")}>{c}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((p) => {
              const { price, markup } = storePrice(p.prices.list, "pct", DEFAULT_MARKUP);
              return (
                <div key={p.slug} className="group flex flex-col gap-2 rounded-xl bg-[#17171A] p-2.5 transition-colors hover:bg-[#1E1E22]">
                  <ProductTile tint={p.tint} icon={p.icon} name={p.name} image={p.images[0]} className="aspect-square w-full rounded-lg" iconSize={48} sizes="200px" />
                  <strong className="line-clamp-2 min-h-[2.5em] text-[13px] leading-tight">{p.name}</strong>
                  <span className="text-[12px] text-[#8A8A93]">Sell at {ngn(price)}</span>
                  <span className="text-[12px] font-bold text-[#3DDC84]">You keep {ngn(sellerNet(markup, plan))} per sale</span>
                  <button type="button" disabled={full || busy === p.slug} onClick={() => save({ slug: p.slug, markupType: "pct", markupValue: DEFAULT_MARKUP, active: true }, `Added ${p.name}`)}
                    className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-extrabold text-black transition-transform hover:scale-[1.03] disabled:opacity-40">
                    {busy === p.slug ? <Loader2 aria-hidden size={15} className="animate-spin" /> : <Plus aria-hidden size={15} />} Add
                  </button>
                </div>
              );
            })}
            {shown.length === 0 && <p className="col-span-full flex items-center justify-center gap-2 p-8 text-[#8A8A93]"><Check aria-hidden size={16} /> Nothing else matches.</p>}
          </div>
        </>
      )}
    </div>
  );
}

/** Markup as % or a fixed ₦ amount; saves when you leave the field. */
function MarkupEditor({ listing, onChange, onCommit }: { listing: MyListing; onChange: (l: MyListing) => void; onCommit: (l: MyListing) => void }) {
  return (
    <span className="col-span-2 flex items-center gap-2 md:col-span-1">
      <span className="flex rounded-full bg-[#0E0E10] p-0.5" role="group" aria-label="Markup type">
        {(["pct", "fixed"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={listing.markupType === t}
            onClick={() => onCommit({ ...listing, markupType: t, markupValue: t === "pct" ? DEFAULT_MARKUP : 5_000 })}
            className={cn("min-h-8 rounded-full px-2.5 text-[12px] font-bold", listing.markupType === t ? "bg-white text-black" : "text-[#A1A1AA]")}>{t === "pct" ? "%" : "₦"}</button>
        ))}
      </span>
      <label className="flex min-h-10 flex-1 items-center rounded-md border border-white/10 bg-[#0E0E10] px-2 focus-within:border-[#F5C542]">
        <span className="sr-only">Markup</span>
        <span className="shrink-0 whitespace-nowrap text-[13px] text-[#6B6B73]">+{listing.markupType === "fixed" ? "₦" : ""}</span>
        <input type="number" inputMode="decimal" min={0} max={listing.markupType === "pct" ? 300 : 5_000_000} value={listing.markupValue}
          onChange={(e) => onChange({ ...listing, markupValue: Number(e.target.value) })} onBlur={() => onCommit(listing)}
          className="w-full min-w-0 bg-transparent px-1 text-[14px] font-bold tabular-nums focus:outline-none" />
        {listing.markupType === "pct" && <span className="text-[13px] text-[#6B6B73]">%</span>}
      </label>
    </span>
  );
}
