"use client";

import { Heart, MapPin, Moon, Plane, Ship } from "lucide-react";
import { ProductTrust } from "@/components/shop/product-trust";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/shop/cart-provider";
import { useLivePromo } from "@/components/shop/live-price";
import { ProductTile } from "@/components/shop/product-card";
import { Countdown } from "@/components/ui/countdown";
import { InfoButton } from "@/components/ui/info-button";
import { useNow } from "@/hooks/use-now";
import type { Product, QA } from "@/lib/catalog/types";
import { cn, compact, naira } from "@/lib/format";
import { PRICING } from "@/lib/pricing/config";
import { unitFromPrices, weekly as weeklyOf } from "@/lib/pricing/prices";
import { addDaysLabel } from "@/lib/time";
import { askQuestion } from "../../actions";
import { attempt } from "@/lib/net";

type Pay = "full" | "small" | "group";

export function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const promo = useLivePromo();
  const now = useNow(60_000);
  // Start on the first variant's choices (e.g. Colour + Size).
  const [choice, setChoice] = useState<Record<string, string>>(() => ({ ...product.variants[0]?.props }));
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [pay, setPay] = useState<Pay>("full");
  const [plan, setPlan] = useState(4);
  const [watch, setWatch] = useState(false);
  const [qa, setQa] = useState<QA[]>(product.qa ?? []);
  const [asking, setAsking] = useState(false);
  const [askNote, setAskNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => Object.entries(v.props).every(([k, val]) => choice[k] === val)) ?? product.variants[0];
  const b = variant.prices;
  const unit = unitFromPrices(b, qty, promo);
  const total = unit * qty;
  const retail = qty >= PRICING.retailerMinQty;
  const sea = product.shipMode === "sea";
  const weekly = weeklyOf(total, plan);
  const photos = [...(variant.image ? [variant.image] : []), ...product.images.filter((u) => u !== variant.image)];
  const eta = now === null ? (sea ? "in 90+ days" : "in 10–18 days") : sea ? `from ${addDaysLabel(now, 90)}` : `${addDaysLabel(now, 10)} – ${addDaysLabel(now, 18)}`;

  const addToCart = () => {
    add(product, variant, qty, unit);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const payOpts: { id: Pay; title: string; sub: string; amount: string }[] = [
    { id: "full", title: "Pay in full", sub: "Card, transfer, USSD or wallet", amount: naira(total) },
    { id: "small", title: "Pay small small", sub: `${plan} weekly payments · 0% interest`, amount: `${naira(weekly)}/wk` },
    { id: "group", title: "Group pay", sub: "Share a link, friends chip in", amount: "from ₦0" },
  ];

  return (
    <div className="flex flex-col gap-2 bg-surface pb-24 md:grid md:grid-cols-[1.1fr_1fr] md:gap-10 md:bg-transparent md:pt-6 md:pb-10">
      {/* Gallery */}
      <div className="flex flex-col gap-2 md:sticky md:top-32 md:flex-row-reverse md:self-start">
        <div className="relative md:min-w-0 md:flex-1">
          <ProductTile tint={product.tint} icon={product.icon} name={product.name} image={photos[image] ?? photos[0]} badge={product.badge} priority sizes="(min-width: 768px) 45vw, 100vw" className="h-[400px] w-full rounded-none md:aspect-[4/5] md:h-auto md:rounded-md" iconSize={150} />
          <span className="absolute bottom-2.5 left-2.5 rounded-sm bg-white px-2 py-1 text-[10px] font-extrabold text-success">QC PHOTOS BEFORE DISPATCH</span>
        </div>
        <div className="no-scrollbar hidden gap-2 md:flex md:flex-col">
          {photos.length > 1
            ? photos.slice(0, 6).map((src, i) => (
                <button key={src} type="button" aria-label={`Photo ${i + 1}`} aria-pressed={image === i} onClick={() => setImage(i)} className={cn("relative h-20 w-16 overflow-hidden rounded", image === i && "outline-2 outline-ink")}>
                  <ProductTile tint={product.tint} icon={product.icon} name="" image={src} sizes="64px" className="size-full" iconSize={20} />
                </button>
              ))
            : [0, 1, 2, 3].map((i) => <span key={i} className={cn("h-20 w-16 rounded", i === 0 && "outline-2 outline-ink")} style={{ background: product.tint, opacity: 1 - i * 0.12 }} />)}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:gap-4">
        {/* Price */}
        <section className="flex flex-col gap-2 bg-white p-3 md:p-0">
          <h1 className="order-2 text-sm leading-snug font-medium md:order-none md:text-2xl md:font-bold">{product.name}</h1>
          <span className="order-3 text-xs text-muted md:order-none">
            ★ {product.rating} ({product.reviews.toLocaleString("en-NG")}) · {compact(product.sold)} sold ·{" "}
            <a href="#qa" className="underline">
              {qa.filter((q) => q.a).length} Q&amp;A
            </a>
          </span>
          <div className="order-1 flex flex-wrap items-baseline gap-2 md:order-none">
            <strong className="text-[26px] text-sale md:text-[32px]">{naira(unit)}</strong>
            {retail && <span className="rounded-sm bg-[#7A5C17] px-1.5 py-0.5 text-[11px] font-extrabold text-white">RETAILER PRICE</span>}
            {promo === "midnight" && !retail && <span className="text-sm text-muted line-through">{naira(b.list)}</span>}
            <span className="text-xs font-bold text-success">Free shipping</span>
          </div>
          <div className="order-1 flex items-center gap-2 rounded-md bg-night px-2.5 py-1.5 text-xs text-white md:order-none md:text-[13px]">
            <Moon aria-hidden size={14} className="text-night-soft" />
            <span className="flex-1">
              Midnight price <strong className="text-night-soft">{naira(b.midnight)}</strong> · {promo === "midnight" ? "ends in" : "in"} <Countdown target="midnight" />
            </span>
            <InfoButton topic="midnight" />
            <button type="button" aria-pressed={watch} onClick={() => setWatch(!watch)} className={cn("min-h-8 rounded-full px-2.5 text-[11px] font-extrabold text-night", watch ? "bg-[#7EE2A8]" : "bg-white")}>
              {watch ? "Alert on" : "Alert me"}
            </button>
          </div>
        </section>

        {/* Variants */}
        <section className="flex flex-col gap-2.5 bg-white p-3 md:p-0">
          {product.options.map((o) => (
            <div key={o.name} className="flex flex-col gap-2">
              <span>
                <strong>{o.name}:</strong> {choice[o.name]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {o.values.map((v) => {
                  const on = choice[o.name] === v.label;
                  const pick = () => setChoice({ ...choice, [o.name]: v.label });
                  return v.hex ? (
                    <button key={v.label} type="button" aria-label={v.label} aria-pressed={on} onClick={pick} className={cn("size-9 rounded-full border-[3px] border-white", on ? "ring-2 ring-ink" : "ring-1 ring-black/20")} style={{ background: v.hex }} />
                  ) : (
                    <button key={v.label} type="button" aria-pressed={on} onClick={pick} className={cn("min-h-10 min-w-12 border-[1.5px] px-3.5 text-[13px] font-bold", on ? "border-ink bg-ink text-white" : "border-black/15")}>
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {variant.stock <= 0 && <p className="font-bold text-sale">This option is out of stock. Try another.</p>}
          <div className="flex items-center gap-2">
            <span className="flex flex-1 items-center">
              <strong>Quantity</strong>
              <InfoButton topic="retailer" />
            </span>
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="size-10 border border-black/15 text-base">−</button>
            <span className="min-w-7 text-center text-[15px] font-extrabold" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty(qty + 1)} className="size-10 border border-black/15 text-base">+</button>
          </div>
          <button type="button" onClick={() => setQty(PRICING.retailerMinQty)} className="min-h-11 border border-dashed border-[#A27B1E] bg-[#FBF6EA] p-2.5 text-left text-xs text-gold-ink">
            Retailer? Buy 10+ at <strong>{naira(b.retailer)}</strong> each ›
          </button>
        </section>

        {/* Delivery */}
        <section className="flex flex-col gap-2.5 bg-white p-3 md:rounded-md md:border md:border-line">
          <div className="flex gap-2.5">
            {sea ? <Ship aria-hidden size={20} className="text-sea" /> : <Plane aria-hidden size={20} className="text-success" />}
            <span className="flex-1">
              <strong className={cn("flex items-center", sea ? "text-sea" : "text-success")}>
                {sea ? "Sea freight · free" : "Free air shipping"}
                <InfoButton topic="shipping" className="-my-2" />
              </strong>
              <span className="text-muted">Arrives {eta} · customs clearing included</span>
            </span>
          </div>
          <Link href="/checkout" className="flex items-center gap-2.5">
            <MapPin aria-hidden size={20} />
            <span className="flex-1">
              <strong className="block">Jumia pickup station · Ikeja</strong>
              <span className="text-muted">SMS + pickup code when it arrives</span>
            </span>
            ›
          </Link>
        </section>

        {/* Pay */}
        <section className="flex flex-col gap-2 bg-white p-3 md:p-0">
          <span className="flex items-center">
            <strong className="text-[13px]">Ways to pay</strong>
            <InfoButton topic="pay" />
          </span>
          {payOpts.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={pay === o.id}
              onClick={() => setPay(o.id)}
              className={cn("flex min-h-[52px] items-center gap-2.5 rounded-md border-[1.5px] bg-white p-2.5 text-left", pay === o.id ? "border-ink" : "border-[#e6e6e6]")}
            >
              <span className={cn("size-4 shrink-0 rounded-full", pay === o.id ? "border-[5px] border-ink" : "border-[1.5px] border-[#999]")} />
              <span className="flex flex-1 flex-col gap-0.5">
                <strong className="text-[13px]">{o.title}</strong>
                <span className="text-[11px] text-muted">{o.sub}</span>
              </span>
              <strong className="text-[13px]">{o.amount}</strong>
            </button>
          ))}
          {pay === "small" && (
            <div className="flex gap-1.5 pl-7">
              {[4, 8, 12].map((n) => (
                <button key={n} type="button" aria-pressed={plan === n} onClick={() => setPlan(n)} className={cn("min-h-10 border-[1.5px] px-3.5 text-[13px] font-bold", plan === n ? "border-ink bg-ink text-white" : "border-black/15")}>
                  {n} wks
                </button>
              ))}
            </div>
          )}
          {/* Desktop actions */}
          <div className="mt-2 hidden gap-2 md:flex">
            <button type="button" onClick={addToCart} className="min-h-12 flex-1 border-[1.5px] border-ink text-sm font-extrabold">
              {added ? "ADDED ✓" : "ADD TO CART"}
            </button>
            <button
              type="button"
              onClick={() => {
                addToCart();
                router.push(`/checkout?pay=${pay}`);
              }}
              className="min-h-12 flex-[1.2] bg-sale text-sm font-extrabold text-white"
            >
              {pay === "small" ? "START PLAN" : pay === "group" ? "GROUP PAY" : "BUY NOW"}
            </button>
          </div>
        </section>

        <ProductTrust sea={product.shipMode === "sea"} />

        <section className="bg-white p-3 md:p-0">
          <h2 className="mb-1.5 text-sm font-extrabold">Details</h2>
          <p className="mb-2 leading-relaxed text-[#333]">{product.description}</p>
          <dl className="grid grid-cols-2 border-t border-line">
            {product.specs.map(([k, v]) => (
              <div key={k} className="border-b border-line py-2 pr-2">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Q&A */}
        <section id="qa" className="flex flex-col gap-2.5 bg-white p-3 md:p-0">
          <h2 className="text-sm font-extrabold">Ask about this product</h2>
          <form
            className="flex gap-1.5"
            onSubmit={async (e) => {
              e.preventDefault();
              const v = draft.trim();
              if (!v || asking) return;
              setAsking(true);
              const call = await attempt(() => askQuestion(product.slug, v));
              setAsking(false);
              const res = call.ok ? call.value : { ok: false, message: call.message };
              setAskNote(res);
              if (res.ok) {
                setQa([{ q: v, who: "You · just now" }, ...qa]);
                setDraft("");
              }
            }}
          >
            <label htmlFor="ask" className="sr-only">Your question</label>
            <input id="ask" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. Does it come with a warranty?" className="min-w-0 flex-1 border border-black/15 px-2.5 text-sm" />
            <button type="submit" disabled={asking} className="min-h-11 bg-ink px-4 text-xs font-extrabold text-white disabled:opacity-60">{asking ? "…" : "ASK"}</button>
          </form>
          {askNote && <p role="status" className={askNote.ok ? "text-success" : "text-sale"}>{askNote.message}</p>}
          {qa.length === 0 && <p className="text-muted">No questions yet. Ask the first one. Our team usually answers within a few hours.</p>}
          {qa.map((q) => (
            <div key={q.q} className="flex flex-col gap-1.5 border-t border-[#f2f2f2] py-2">
              <span className="flex gap-2">
                <span className="flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-ink text-[10px] font-bold text-white">Q</span>
                <span>
                  <strong className="text-[13px] font-semibold">{q.q}</strong>
                  <span className="block text-[11px] text-subtle">{q.who}</span>
                </span>
              </span>
              {q.a ? (
                <span className="flex gap-2">
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-success text-[10px] font-bold text-white">A</span>
                  <span className="leading-relaxed">
                    {q.a}
                    <span className="block text-[11px] font-bold text-success">{q.by}</span>
                  </span>
                </span>
              ) : (
                <span className="ml-6 font-bold text-[#7A5C17]">Waiting for our team · we’ll notify you</span>
              )}
            </div>
          ))}
        </section>
      </div>

      {/* Phone action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-white px-2.5 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
        <button type="button" aria-label="Save to wishlist" className="flex size-11 items-center justify-center">
          <Heart aria-hidden size={24} strokeWidth={1.7} />
        </button>
        <button type="button" onClick={addToCart} className="min-h-[46px] flex-1 border-[1.5px] border-ink text-[13px] font-extrabold">
          {added ? "ADDED ✓" : "ADD TO CART"}
        </button>
        <button
          type="button"
          onClick={() => {
            addToCart();
            router.push(`/checkout?pay=${pay}`);
          }}
          className="min-h-[46px] flex-[1.2] bg-sale text-[13px] font-extrabold text-white"
        >
          {pay === "small" ? "START PLAN" : pay === "group" ? "GROUP PAY" : "BUY NOW"}
        </button>
      </div>
    </div>
  );
}
