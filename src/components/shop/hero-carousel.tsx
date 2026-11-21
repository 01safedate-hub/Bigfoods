"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductIcon } from "@/components/ui/product-icon";
import { cn } from "@/lib/format";
import { EventBanner } from "./event-banner";
import { RotatingPhoto } from "./rotating-photo";

type Photos = Record<"gadgets" | "women" | "hair" | "sea", string[]>;

const SLIDE_MS = 15_000;

/** Sky blue: gadgets. Big airy gradient, floating devices. */
function GadgetsSlide({ photos }: { photos: string[] }) {
  return (
    <Link href="/categories?c=gadgets" className="relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-[linear-gradient(135deg,#BFE6FF_0%,#7CC8F5_55%,#3A9BE0_100%)] p-[18px] text-[#06264A] md:p-8">
      <span aria-hidden className="absolute -right-10 -top-10 size-56 rounded-full bg-white/25 md:size-96" />
      <span aria-hidden className="absolute -bottom-6 right-20 size-28 rounded-full bg-white/20 md:right-56 md:size-44" />
      <span aria-hidden className="absolute right-3 top-[58%] flex -translate-y-1/2 items-end gap-1.5 md:right-14 md:top-1/2 md:gap-5">
        {photos.length ? (
          <>
            <RotatingPhoto images={photos} sizes="(min-width: 768px) 176px, 88px" className="size-[78px] rounded-2xl bg-white shadow-lg ring-4 ring-white/70 md:size-44" />
            <RotatingPhoto images={photos} offset={1} sizes="(min-width: 768px) 144px, 72px" className="-mb-3 size-[66px] rounded-2xl bg-white shadow-xl ring-4 ring-white md:-mb-4 md:size-36" />
            <RotatingPhoto images={photos} offset={2} sizes="128px" className="hidden size-32 rounded-2xl bg-white shadow-lg ring-4 ring-white/60 md:block" />
          </>
        ) : (
          <>
            <span className="rounded-2xl bg-white/70 p-2 shadow-lg md:p-5"><ProductIcon icon="laptop" size={36} className="text-[#06264A] md:size-24" /></span>
            <span className="-mb-3 rounded-2xl bg-white p-1.5 shadow-xl md:-mb-4 md:p-4"><ProductIcon icon="phone" size={32} className="text-[#06264A] md:size-20" /></span>
            <span className="hidden rounded-2xl bg-white/60 p-4 shadow-lg md:block"><ProductIcon icon="drone" size={64} className="text-[#06264A]" /></span>
          </>
        )}
      </span>
      <span className="relative text-[10px] font-extrabold tracking-[0.18em] md:text-xs">PHONES · LAPTOPS · DRONES</span>
      <span className="relative text-[34px] font-black leading-[0.92] tracking-tight md:text-7xl">Shop<br />gadgets</span>
      <span className="relative flex items-center gap-3">
        <span className="rounded-full bg-[#06264A] px-4 py-2 text-[11px] font-extrabold text-white md:px-6 md:py-3 md:text-[13px]">SHOP NOW</span>
        <span className="text-[11px] font-semibold md:text-sm">Air only · 10–18 days</span>
      </span>
    </Link>
  );
}

/** Golden: the women's place. Serif italic, warm gold, thin rules. */
function WomenSlide({ photos }: { photos: string[] }) {
  return (
    <Link href="/categories?c=women" className="relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-[#E9C46A] p-[18px] text-[#2B1E05] md:p-8">
      <span aria-hidden className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(90deg,transparent_0_22px,rgb(43_30_5/0.08)_22px_23px)]" />
      <span aria-hidden className="absolute -bottom-16 -right-6 flex size-48 items-center justify-center rounded-full border border-[#2B1E05]/25 md:-bottom-24 md:right-16 md:size-96">
        <span className="flex size-36 items-center justify-center overflow-hidden rounded-full bg-[#F6E3B4] md:size-72">
          <RotatingPhoto images={photos} sizes="(min-width: 768px) 288px, 144px" className="size-full" fallback={<ProductIcon icon="dress" size={56} className="text-[#2B1E05]/70 md:size-28" />} />
        </span>
      </span>
      <span className="relative text-[10px] font-bold tracking-[0.3em] md:text-xs">NEW SEASON</span>
      <span className="relative font-display text-[40px] italic leading-[0.9] md:text-8xl">The women’s<br />place</span>
      <span className="relative flex items-center gap-3">
        <span className="border-b-2 border-[#2B1E05] pb-0.5 text-[11px] font-extrabold tracking-wide md:text-sm">Dresses, bags & beauty →</span>
      </span>
    </Link>
  );
}

/** Blush: hair. Soft rounded shapes, bold rounded type. */
function HairSlide({ photos }: { photos: string[] }) {
  return (
    <Link href="/categories?c=hair" className="relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-[#F7D9DE] p-[18px] text-[#5B0F25] md:p-8">
      <span aria-hidden className="absolute -right-8 top-4 size-36 rounded-[45%] bg-[#EFB7C2] md:right-10 md:top-8 md:size-72" />
      <span aria-hidden className="absolute right-20 -bottom-10 size-24 rounded-[40%] bg-[#E89BAA] md:right-72 md:size-40" />
      <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 md:right-24">
        <RotatingPhoto images={photos} sizes="(min-width: 768px) 224px, 112px" className="size-28 rounded-[42%] shadow-lg ring-4 ring-[#EFB7C2] md:size-56" fallback={<ProductIcon icon="wig" size={64} className="text-[#5B0F25] md:size-32" />} />
      </span>
      <span className="relative w-fit rounded-full bg-[#5B0F25] px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-[#F7D9DE] md:text-xs">HUMAN HAIR · HD LACE</span>
      <span className="relative text-[34px] font-extrabold leading-[0.95] md:text-7xl">Wigs that<br />slay</span>
      <span className="relative text-[11px] font-semibold md:text-[15px]">From ₦87,300 · Pay small small available</span>
    </Link>
  );
}

/** Deep sea: furniture and machines by sea. Wave lines, navy and gold. */
function SeaSlide({ photos }: { photos: string[] }) {
  return (
    <Link href="/categories?c=furniture" className="relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-sea p-[18px] text-white md:p-8">
      <svg aria-hidden viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-40">
        {[0, 18, 36, 54].map((y) => (
          <path key={y} d={`M0 ${40 + y} Q50 ${20 + y} 100 ${40 + y} T200 ${40 + y} T300 ${40 + y} T400 ${40 + y}`} fill="none" stroke="#7DD3FC" strokeWidth="1.2" />
        ))}
      </svg>
      <span aria-hidden className="absolute right-5 top-[42%] md:right-14 md:top-[30%]">
        <RotatingPhoto images={photos} sizes="(min-width: 768px) 192px, 96px" className="size-24 -translate-y-1/3 rounded-lg ring-2 ring-gold md:size-48" fallback={<ProductIcon icon="sofa" size={60} className="text-gold md:size-28" />} />
      </span>
      <span className="relative text-[10px] font-extrabold tracking-[0.18em] text-gold md:text-xs">BY SEA · 90+ DAYS</span>
      <span className="relative text-[32px] font-extrabold leading-[0.95] md:text-6xl">Furnish the<br />whole house</span>
      <span className="relative flex items-center gap-3">
        <span className="bg-gold px-4 py-2 text-[11px] font-extrabold text-sea md:px-6 md:py-3 md:text-[13px]">SEE FURNITURE</span>
        <span className="text-[11px] opacity-80 md:text-sm">Sofas, tables & machines</span>
      </span>
    </Link>
  );
}

const slides = (p: Photos) => [
  { label: "This week’s event", node: <EventBanner /> },
  { label: "Shop gadgets", node: <GadgetsSlide photos={p.gadgets} /> },
  { label: "The women’s place", node: <WomenSlide photos={p.women} /> },
  { label: "Wigs", node: <HairSlide photos={p.hair} /> },
  { label: "Furniture by sea", node: <SeaSlide photos={p.sea} /> },
];
const NO_PHOTOS: Photos = { gadgets: [], women: [], hair: [], sea: [] };

/**
 * Hero slides. Swipe or use the dots; it moves on every 15 seconds, pauses while
 * hovered, focused or off-screen, and has a pause button (WCAG 2.2.2).
 */
export function HeroCarousel({ photos = NO_PHOTOS }: { photos?: Photos }) {
  const SLIDES = slides(photos);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + SLIDES.length) % SLIDES.length;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (paused || hover) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [index, paused, hover]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative h-44 w-full min-w-0 md:h-full md:min-h-[300px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== index) setIndex(i);
        }}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-md"
      >
        {SLIDES.map((s, i) => (
          <div key={s.label} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}: ${s.label}`} aria-hidden={i !== index} inert={i !== index} className="h-full w-full shrink-0 snap-start">
            {s.node}
          </div>
        ))}
      </div>
      <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/25 px-1 py-0.5 backdrop-blur-sm md:right-3 md:top-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-label={`Show slide ${i + 1}: ${s.label}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className="flex h-6 items-center justify-center px-0.5"
          >
            <span className={cn("block h-1.5 rounded-full bg-white transition-all", i === index ? "w-5" : "w-1.5 opacity-60")} />
          </button>
        ))}
        <button type="button" aria-label={paused ? "Play slides" : "Pause slides"} onClick={() => setPaused(!paused)} className="flex size-6 items-center justify-center text-white">
          {paused ? <Play aria-hidden size={11} fill="currentColor" /> : <Pause aria-hidden size={11} fill="currentColor" />}
        </button>
      </div>
    </section>
  );
}
