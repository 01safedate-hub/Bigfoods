"use client";

import { House, LayoutGrid, Ship, ShoppingBag, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { useWholesaleCart } from "@/lib/wholesale/cart";
import { useCart } from "./cart-provider";

const TABS: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "Shop", icon: House, match: (p) => p === "/" },
  { href: "/categories", label: "Categories", icon: LayoutGrid, match: (p) => p.startsWith("/categor") },
  { href: "/wholesale", label: "Wholesale", icon: Ship, match: (p) => p.startsWith("/wholesale") },
  { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p) => p.startsWith("/cart") },
  { href: "/account", label: "Me", icon: User, match: (p) => p.startsWith("/account") },
];

/** Minimal bottom navigation on phones. Wholesale pages count the wholesale cart. */
export function TabBar() {
  const path = usePathname();
  const { count } = useCart();
  const wholesale = useWholesaleCart().length;
  // Pages with their own sticky action bar hide the tabs, like native shopping apps.
  if (path.startsWith("/product/") || path.startsWith("/wholesale/p/") || path.startsWith("/checkout") || path.startsWith("/c/")) return null;
  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line/70 bg-white/95 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(path);
        const badge = href === "/cart" ? count : href === "/wholesale" ? wholesale : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={badge ? `${label}, ${badge} items` : undefined}
            className={cn("relative flex h-10 flex-col items-center justify-center gap-px text-[10px] leading-none", active ? "font-bold text-ink" : "text-subtle")}
          >
            <Icon aria-hidden size={20} strokeWidth={active ? 2.2 : 1.6} className={cn(href === "/wholesale" && "text-sale")} />
            {label}
            {badge > 0 && <span className="absolute top-0 left-1/2 ml-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-sale px-1 text-[9px] font-extrabold text-white">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
