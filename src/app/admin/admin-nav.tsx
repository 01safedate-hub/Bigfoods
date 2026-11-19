"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const NAV: { label: string; href?: string; badge?: number }[] = [
  { label: "Dashboard", href: "/admin" }, { label: "Orders", href: "/admin/orders" }, { label: "Products", href: "/admin/products" }, { label: "Purchasing & dispatch", href: "/admin/purchasing" },
  { label: "Q&A inbox", href: "/admin/questions" }, { label: "Emails & notifications", href: "/admin/emails" }, { label: "Coupons, events & stations", href: "/admin/settings" },
  { label: "Pricing rules & guardrails", href: "/admin/pricing" }, { label: "Staff & roles", href: "/admin/staff" },
  { label: "Group pay & plans" }, { label: "Cart Clear-Out" }, { label: "Dropship sellers", href: "/admin/sellers" }, { label: "Customers" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
      {NAV.map((n) => {
        const active = n.href === path || (n.href === "/admin/products" && path.startsWith("/admin/products"));
        const cls = cn(
          "flex min-h-9 shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-md px-2.5 text-[13px]",
          active ? "bg-[#23262E] font-bold text-white" : n.href ? "text-[#D7DAE0] hover:bg-[#1A1D24]" : "text-[#7C828E]",
        );
        const inner = (
          <>
            <span>{n.label}</span>
            {n.badge && <span className="rounded-full bg-sale px-1.5 text-[11px] font-extrabold text-white">{n.badge}</span>}
          </>
        );
        return n.href ? (
          <Link key={n.label} href={n.href} aria-current={active ? "page" : undefined} className={cls}>{inner}</Link>
        ) : (
          <span key={n.label} className={cls} title="Coming next">{inner}</span>
        );
      })}
    </nav>
  );
}
