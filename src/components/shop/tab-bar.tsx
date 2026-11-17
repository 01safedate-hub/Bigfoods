"use client";

import { House, LayoutGrid, ShoppingCart, User, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { useCart } from "./cart-provider";

const TABS: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "Shop", icon: House, match: (p) => p === "/" },
  { href: "/categories", label: "Category", icon: LayoutGrid, match: (p) => p.startsWith("/categories") },
  { href: "/deals", label: "Deals", icon: Zap, match: (p) => p.startsWith("/deals") },
  { href: "/cart", label: "Cart", icon: ShoppingCart, match: (p) => p.startsWith("/cart") },
  { href: "/account", label: "Me", icon: User, match: (p) => p.startsWith("/account") },
];

/** App-style bottom navigation on phones only. */
export function TabBar() {
  const path = usePathname();
  const { count } = useCart();
  // Pages with their own sticky action bar hide the tabs, like native shopping apps.
  if (path.startsWith("/product/") || path.startsWith("/checkout") || path.startsWith("/c/")) return null;
  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(path);
        const isCart = label === "Cart";
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={isCart ? `Cart, ${count} items` : undefined}
            className={cn("relative flex min-h-11 flex-col items-center gap-0.5 text-[11px]", active ? "font-extrabold text-sale" : "text-muted")}
          >
            <Icon aria-hidden size={24} strokeWidth={active ? 2 : 1.6} />
            {isCart ? <span className="rounded-full bg-success px-1.5 text-[10px] font-bold text-white">Free</span> : label}
            {isCart && count > 0 && (
              <span className="absolute -top-0.5 left-1/2 ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-extrabold text-white">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
