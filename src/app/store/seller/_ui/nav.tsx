"use client";

import { BarChart3, Home, Package, Paintbrush, ReceiptText, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoltMark } from "@/components/shop/header";
import { cn } from "@/lib/format";

const BASE = "/store/seller";
const ITEMS = [
  { href: BASE, label: "Home", icon: Home },
  { href: `${BASE}/products`, label: "Products", icon: Package },
  { href: `${BASE}/orders`, label: "Orders", icon: ReceiptText },
  { href: `${BASE}/earnings`, label: "Earnings", icon: Wallet },
  { href: `${BASE}/design`, label: "Design", icon: Paintbrush },
  { href: `${BASE}/plan`, label: "Plan", icon: Sparkles },
];

export function SellerNav() {
  const path = usePathname().replace(/\/$/, "");
  // On fastchina.store the dashboard is served at /seller (the proxy adds /store).
  const active = (href: string) => {
    const p = path.startsWith("/store") ? path : `/store${path}`;
    return href === BASE ? p === BASE : p.startsWith(href);
  };
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 bg-black p-3 md:flex">
        <Link href={BASE} className="mb-4 flex items-center gap-2 px-2 pt-2">
          <BoltMark size={30} />
          <span className="text-[15px] font-black italic tracking-tight">FASTCHINA<span className="ml-1 text-[11px] font-bold not-italic text-[#A1A1AA]">seller</span></span>
        </Link>
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
            className={cn("flex min-h-11 items-center gap-3.5 rounded-md px-3 text-[14px] font-bold transition-colors", active(href) ? "bg-[#1E1E22] text-white" : "text-[#A1A1AA] hover:text-white")}>
            <Icon aria-hidden size={20} strokeWidth={active(href) ? 2.4 : 1.8} /> {label}
          </Link>
        ))}
        <div className="mt-auto rounded-lg bg-[#17171A] p-3 text-xs text-[#A1A1AA]">
          <BarChart3 aria-hidden size={16} className="mb-1.5 text-[#F5C542]" />
          Paid every Friday for delivered orders. Questions? help@fastchina.shop
        </div>
      </aside>
      <nav aria-label="Seller" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
            className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold", active(href) ? "text-white" : "text-[#8A8A93]")}>
            <Icon aria-hidden size={21} strokeWidth={active(href) ? 2.4 : 1.8} /> {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
