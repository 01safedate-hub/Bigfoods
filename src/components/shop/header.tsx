"use client";

import { Camera, Heart, MapPin, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "@/lib/catalog/categories";
import { cn } from "@/lib/format";
import { useCart } from "./cart-provider";

/** The bolt: FastChina's mark. Used alone on phones and as the favicon. */
export function BoltMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      <rect width="64" height="64" rx="14" fill="#111111" />
      <path d="M36.5 8 15 36h14l-3.5 20L49 27H35z" fill="#F5C542" />
    </svg>
  );
}

export function Logo({ className, tld = ".shop", compactMark }: { className?: string; tld?: string; compactMark?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BoltMark size={compactMark ? 30 : 34} />
      <span className={cn("flex items-baseline italic", compactMark && "sr-only")}>
        <span className="text-[22px] font-black tracking-[-0.02em]">FAST</span>
        <span className="text-[22px] font-black tracking-[-0.02em] text-sale">CHINA</span>
        <span className="ml-0.5 text-[11px] font-bold not-italic text-subtle">{tld}</span>
      </span>
    </span>
  );
}

const DESKTOP_NAV = [
  { href: "/deals", label: "Deals", strong: true },
  { href: "/categories?c=gadgets", label: "Phones & Gadgets" },
  { href: "/categories?c=women", label: "Women" },
  { href: "/categories?c=men", label: "Men" },
  { href: "/categories?c=hair", label: "Hair & Wigs" },
  { href: "/categories?c=beauty", label: "Beauty" },
  { href: "/categories?c=home", label: "Home" },
  { href: "/categories?c=furniture", label: "Furniture · Sea" },
  { href: "/categories?c=machines", label: "Machines · Sea" },
  { href: "/categories?c=retailer", label: "Retailer Hub" },
];

export function ShopHeader() {
  const { count } = useCart();
  const path = usePathname();
  const showDepts = path === "/";
  // These pages draw their own search box or title bar on phones; one header is enough.
  const ownBar = path === "/search" || path === "/checkout";
  const onSearch = path === "/search";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      {/* Phones */}
      <div className={cn("flex items-center gap-2 px-3 pt-2.5 pb-2 md:hidden", ownBar && "hidden")}>
        <Link href="/" aria-label="FastChina home" className="flex h-11 items-center">
          <Logo compactMark />
        </Link>
        <Link href="/search" className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-md border-2 border-ink">
          <span className="flex-1 truncate px-2.5 text-sm text-muted">Lace front wig</span>
          <Camera aria-hidden size={20} strokeWidth={1.6} className="mr-2 text-subtle" />
          <span className="flex h-full w-12 items-center justify-center bg-ink">
            <Search aria-hidden size={18} strokeWidth={2.2} className="text-white" />
          </span>
          <span className="sr-only">Search</span>
        </Link>
        <Link href="/account" aria-label="Wishlist" className="flex h-11 w-9 items-center justify-center">
          <Heart aria-hidden size={24} strokeWidth={1.6} />
        </Link>
      </div>
      {showDepts && (
        <nav aria-label="Departments" className="no-scrollbar flex gap-0.5 overflow-x-auto whitespace-nowrap px-1 md:hidden">
          {DEPARTMENTS.map((d, i) => (
            <Link
              key={d}
              href={i === 0 ? "/" : `/categories`}
              className={cn("border-b-[3px] px-2.5 pt-2 pb-2 text-[15px]", i === 0 ? "border-ink font-extrabold" : "border-transparent font-semibold text-subtle")}
            >
              {d}
            </Link>
          ))}
        </nav>
      )}

      {/* Tablets and desktops */}
      <div className="mx-auto hidden max-w-[1360px] items-center gap-6 px-6 py-3 md:flex">
        <Link href="/" aria-label="FastChina home">
          <Logo />
        </Link>
        <form action="/search" role="search" className={cn(onSearch && "invisible", "flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-full border-[1.5px] border-ink")}>
          <label htmlFor="q" className="sr-only">
            Search FastChina
          </label>
          <input id="q" name="q" type="search" placeholder="Search phones, wigs, chairs, or paste a 1688 link" className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
          <button type="submit" aria-label="Search" className="flex h-full w-14 items-center justify-center bg-ink text-white">
            <Search aria-hidden size={18} />
          </button>
        </form>
        <Link href="/checkout" className="hidden min-h-11 items-center gap-2 rounded-lg border border-line px-3 lg:flex">
          <MapPin aria-hidden size={18} />
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted">Pickup station</span>
            <strong className="text-[13px]">Ikeja, Lagos</strong>
          </span>
        </Link>
        <div className="flex items-center">
          <Link href="/account" aria-label="Account" className="flex size-11 items-center justify-center">
            <User aria-hidden size={22} strokeWidth={1.6} />
          </Link>
          <Link href="/account" aria-label="Wishlist" className="flex size-11 items-center justify-center">
            <Heart aria-hidden size={22} strokeWidth={1.6} />
          </Link>
          <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative flex size-11 items-center justify-center">
            <ShoppingCart aria-hidden size={22} strokeWidth={1.6} />
            {count > 0 && (
              <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sale px-1 text-[10px] font-extrabold text-white">{count}</span>
            )}
          </Link>
        </div>
      </div>
      <nav aria-label="Departments" className="no-scrollbar mx-auto hidden max-w-[1360px] gap-1 overflow-x-auto whitespace-nowrap px-4 text-sm font-semibold md:flex">
        {DESKTOP_NAV.map((n) => (
          <Link key={n.label} href={n.href} className={cn("px-2.5 py-2.5", n.strong && "font-extrabold text-sale")}>
            {n.label}
          </Link>
        ))}
        <Link href="/store" className="ml-auto px-2.5 py-2.5 text-gold-ink">
          Sell on FastChina ›
        </Link>
      </nav>
    </header>
  );
}
