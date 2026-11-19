"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

type Role = "super_admin" | "finance" | "purchasing" | "warehouse" | "customer_care" | "marketing";
const ALL: Role[] = ["super_admin", "finance", "purchasing", "warehouse", "customer_care", "marketing"];

/** Tabs and the roles that see them. Super admin sees everything. */
const NAV: { label: string; href: string; roles: Role[] }[] = [
  { label: "Dashboard", href: "/admin", roles: ALL },
  { label: "Orders", href: "/admin/orders", roles: ["super_admin", "finance", "purchasing", "warehouse", "customer_care"] },
  { label: "Wholesale", href: "/admin/wholesale", roles: ["super_admin", "finance", "purchasing", "warehouse", "marketing"] },
  { label: "Products", href: "/admin/products", roles: ["super_admin", "purchasing", "marketing"] },
  { label: "Purchasing & dispatch", href: "/admin/purchasing", roles: ["super_admin", "purchasing", "warehouse", "finance", "customer_care"] },
  { label: "Accounts", href: "/admin/accounts", roles: ["super_admin", "finance"] },
  { label: "Customers", href: "/admin/customers", roles: ["super_admin", "finance", "customer_care", "marketing"] },
  { label: "Q&A inbox", href: "/admin/questions", roles: ["super_admin", "customer_care", "marketing"] },
  { label: "Reviews", href: "/admin/reviews", roles: ["super_admin", "customer_care", "marketing"] },
  { label: "Emails & notifications", href: "/admin/emails", roles: ["super_admin", "customer_care", "marketing"] },
  { label: "Coupons, events & stations", href: "/admin/settings", roles: ["super_admin", "marketing", "warehouse"] },
  { label: "Group pay & plans", href: "/admin/plans", roles: ["super_admin", "finance", "customer_care"] },
  { label: "Cart Clear-Out", href: "/admin/draws", roles: ["super_admin", "finance", "marketing"] },
  { label: "Pricing rules & guardrails", href: "/admin/pricing", roles: ["super_admin", "finance"] },
  { label: "Dropship sellers", href: "/admin/sellers", roles: ["super_admin", "finance", "customer_care"] },
  { label: "Staff & roles", href: "/admin/staff", roles: ["super_admin"] },
  { label: "Guide", href: "/admin/guide", roles: ALL },
];

export function AdminNav({ role }: { role: string | null }) {
  const path = usePathname();
  const items = NAV.filter((n) => role === null || n.roles.includes(role as Role));
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((n) => {
        const active = n.href === path || (n.href !== "/admin" && path.startsWith(n.href));
        const cls = cn(
          "flex min-h-9 shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-md px-2.5 text-[13px]",
          active ? "bg-[#23262E] font-bold text-white" : "text-[#D7DAE0] hover:bg-[#1A1D24]",
        );
        return (
          <Link key={n.label} href={n.href} aria-current={active ? "page" : undefined} className={cls}>{n.label}</Link>
        );
      })}
    </nav>
  );
}
