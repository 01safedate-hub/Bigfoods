import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMe, ORDER_GROUPS, type OrderGroup } from "@/lib/data/me";
import { cn, naira } from "@/lib/format";
import { trackingStep, type OrderStatus } from "@/lib/orders/lifecycle";
import { SettingsShell } from "../settings/ui";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };
const PAY: Record<string, string> = { full: "Paid in full", small: "Pay small small", group: "Group pay" };

export default function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  return (
    <SettingsShell title="My orders" back="/account">
      <Suspense fallback={<div className="h-64 bg-white" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </SettingsShell>
  );
}

async function Body({ searchParams }: { searchParams: PageProps<"/account/orders">["searchParams"] }) {
  await connection();
  const me = await getMe();
  if (!me) redirect("/sign-in?mode=signin&next=/account/orders");
  const raw = (await searchParams).tab;
  const tab = (typeof raw === "string" && raw in ORDER_GROUPS ? raw : "all") as OrderGroup | "all";
  const list = tab === "all" ? me.orders : me.orders.filter((o) => (ORDER_GROUPS[tab].statuses as readonly string[]).includes(o.status));
  return (
    <>
      <nav aria-label="Order status" className="no-scrollbar flex gap-1.5 overflow-x-auto bg-white px-3 py-2.5 md:rounded-2xl md:border md:border-line">
        {(["all", ...Object.keys(ORDER_GROUPS)] as (OrderGroup | "all")[]).map((g) => (
          <Link key={g} href={g === "all" ? "/account/orders" : `/account/orders?tab=${g}`} aria-current={tab === g ? "page" : undefined}
            className={cn("min-h-9 shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold", tab === g ? "bg-ink text-white" : "bg-surface")}>
            {g === "all" ? "All" : ORDER_GROUPS[g].label}{g !== "all" && me.counts[g] ? ` (${me.counts[g]})` : ""}
          </Link>
        ))}
      </nav>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 bg-white px-6 py-14 text-center md:rounded-2xl md:border md:border-line">
          <Package aria-hidden size={40} strokeWidth={1.2} className="text-subtle" />
          <p className="text-[15px] font-bold">No orders here yet</p>
          <Link href="/" className="min-h-11 rounded-full bg-ink px-6 py-3 text-[14px] font-bold text-white">Start shopping</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((o) => (
            <li key={o.code} className="flex flex-col gap-2 bg-white p-4 md:rounded-2xl md:border md:border-line">
              <div className="flex items-center justify-between gap-2">
                <strong className="font-mono text-[14px]">#{o.code}</strong>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold">{trackingStep(o.status as OrderStatus).label}</span>
              </div>
              <ul className="text-[13px] text-muted">
                {o.items.map((i, k) => <li key={k} className="truncate">{i.qty}× {i.title}{i.variant_label ? ` · ${i.variant_label}` : ""}</li>)}
              </ul>
              <div className="flex items-center justify-between gap-2 border-t border-line pt-2 text-[13px]">
                <span className="text-muted">{PAY[o.pay_mode] ?? o.pay_mode} · {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}</span>
                <span className="flex items-center gap-3">
                  <strong>{naira(o.total_ngn)}</strong>
                  <Link href={`/track?code=${o.code}`} className="rounded-full border border-ink px-3 py-1.5 text-[12px] font-bold">Track</Link>
                </span>
              </div>
              {o.paid_ngn < o.total_ngn && !["cancelled", "refunded"].includes(o.status) && (
                <p className="text-[12px] font-semibold text-sale">{naira(o.total_ngn - o.paid_ngn)} still to pay</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
