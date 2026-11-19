"use client";

import { MapPin, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "@/lib/catalog/categories";
import { cn } from "@/lib/format";
import { useCart } from "./cart-provider";
import { BrandWordmark, MARK_PATH } from "./brand";
import { useStationId } from "@/lib/station-store";
import { useSiteData } from "./site-data";

/** The app icon: the winged F on black. Used alone on phones and as the favicon. */
export function BoltMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      <rect width="64" height="64" rx="14" fill="#111111" />
      <g transform="translate(6 20.3) scale(0.0881)"><path fill="#FFFFFF" fillRule="evenodd" d={MARK_PATH} /></g>
    </svg>
  );
}

/** The FastChina wordmark. On phones (compactMark) only the icon shows to save room. */
export function Logo({ className, tld = ".shop", compactMark }: { className?: string; tld?: string; compactMark?: boolean }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      {compactMark ? (
        <>
          <BoltMark size={30} />
          <span className="sr-only">FastChina{tld}</span>
        </>
      ) : (
        <>
          <BrandWordmark className="h-[26px] w-auto text-ink" title={`FastChina${tld}`} />
          <span aria-hidden className="mt-2 self-start text-[11px] font-bold text-subtle">{tld}</span>
        </>
      )}
    </span>
  );
}

const DESKTOP_NAV = [
  { href: "/deals", label: "Deals", strong: true },
  { href: "/category/gadgets", label: "Phones & Gadgets" },
  { href: "/categories?c=women", label: "Women" },
  { href: "/categories?c=men", label: "Men" },
  { href: "/category/hair", label: "Hair & Wigs" },
  { href: "/category/beauty", label: "Beauty" },
  { href: "/category/home", label: "Home" },
  { href: "/category/furniture", label: "Furniture · Sea" },
  { href: "/category/machines", label: "Machines · Sea" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/guides", label: "Guides" },
];

/** The customer's pickup station (desktop header). */
function StationChip() {
  const id = useStationId();
  const { stations } = useSiteData();
  const s = stations.find((x) => x.id === id);
  return (
    <Link href="/account/settings/station" className="hidden min-h-11 items-center gap-2 rounded-lg border border-line px-3 lg:flex">
      <MapPin aria-hidden size={18} />
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] text-muted">Pickup station</span>
        <strong className="max-w-40 truncate text-[13px]">{s ? `${s.area}, ${s.state}` : "Choose station"}</strong>
      </span>
    </Link>
  );
}

export function ShopHeader() {
  const { count } = useCart();
  const path = usePathname();
  const showDepts = path === "/";
  // These pages draw their own search box or title bar on phones; one header is enough.
  const ownBar = path === "/search" || path === "/checkout";
  const onSearch = path === "/search";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      {/* Phones: one slim row, full wordmark and search */}
      <div className={cn("flex items-center gap-2.5 px-3 py-1 md:hidden", ownBar && "hidden")}>
        <Link href="/" aria-label="FastChina home" className="flex h-8 shrink-0 items-center">
          <BrandWordmark className="h-[17px] w-auto text-ink" />
        </Link>
        <Link href="/search" className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-full border-[1.5px] border-ink">
          <span className="flex-1 truncate pl-3.5 text-[13px] text-muted">Lace front wig</span>
          <span className="m-[3px] flex h-6 w-10 items-center justify-center rounded-full bg-ink">
            <Search aria-hidden size={15} strokeWidth={2.4} className="text-white" />
          </span>
          <span className="sr-only">Search</span>
        </Link>
      </div>
      {showDepts && (
        <nav aria-label="Departments" className="no-scrollbar flex gap-0.5 overflow-x-auto whitespace-nowrap px-1 md:hidden">
          {DEPARTMENTS.map((d, i) => (
            <Link
              key={d}
              href={i === 0 ? "/" : `/categories`}
              className={cn("border-b-[2.5px] px-2.5 pt-0.5 pb-1 text-[14px]", i === 0 ? "border-ink font-extrabold" : "border-transparent font-semibold text-subtle")}
            >
              {d}
            </Link>
          ))}
        </nav>
      )}

      {/* Tablets and desktops */}
      <div className="mx-auto hidden max-w-[1360px] items-center gap-6 px-6 py-2 md:flex">
        <Link href="/" aria-label="FastChina home">
          <Logo />
        </Link>
        <form action="/search" role="search" className={cn(onSearch && "invisible", "flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-full border-[1.5px] border-ink")}>
          <label htmlFor="q" className="sr-only">
            Search FastChina
          </label>
          <input id="q" name="q" type="search" placeholder="Search phones, wigs, dresses, chairs…" className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
          <button type="submit" aria-label="Search" className="flex h-full w-14 items-center justify-center bg-ink text-white">
            <Search aria-hidden size={18} />
          </button>
        </form>
        <StationChip />
        <div className="flex items-center">
          <Link href="/account" aria-label="Account" className="flex size-11 items-center justify-center">
            <User aria-hidden size={22} strokeWidth={1.6} />
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
