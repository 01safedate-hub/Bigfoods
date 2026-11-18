import type { Metadata } from "next";
import { connection } from "next/server";
import { getSeller, getSellerOrders, type SellerOrderRow } from "@/lib/data/seller";
import { DemoNote, Gate } from "../_ui/gate";
import { Card, ngn, Page, StatusPill } from "../_ui/ui";

export const metadata: Metadata = { title: "Orders" };

const SAMPLE: SellerOrderRow[] = [
  { code: "B7D0013F", status: "paid", created_at: "2026-11-18T08:41:00Z", state: "Lagos", items: [{ title: "Satin cowl-neck midi dress", variant: "Wine / M", qty: 1 }], profit: 5_510, bucket: "pending" },
  { code: "4C19AE02", status: "shipped", created_at: "2026-11-17T19:12:00Z", state: "FCT Abuja", items: [{ title: "Body wave lace front wig", variant: "22\"", qty: 1 }], profit: 20_710, bucket: "pending" },
  { code: "737012B0", status: "delivered", created_at: "2026-11-16T14:03:00Z", state: "Rivers", items: [{ title: "Quilted crossbody chain bag", variant: "Black", qty: 1 }, { title: "Matte liquid lipstick set", variant: null, qty: 1 }], profit: 6_700, bucket: "available" },
];

export default async function OrdersPage() {
  await connection();
  const state = await getSeller();
  if (state.kind !== "live" && state.kind !== "demo") return <Gate state={state} />;
  const orders = (state.kind === "demo" ? SAMPLE : await getSellerOrders()) ?? [];
  return (
    <Page title="Orders" subtitle="FastChina buys, checks, ships and delivers every order. You don’t need to do anything; this is so you can follow along.">
      <DemoNote demo={state.kind === "demo"} />
      <Card className="p-0 md:p-0">
        {orders.length === 0 && <p className="p-10 text-center text-[#8A8A93]">No orders yet.</p>}
        <ul>
          {orders.map((o) => (
            <li key={o.code} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 px-4 py-3.5 first:border-0 md:px-5">
              <span className="min-w-0 flex-1">
                <strong className="font-mono text-[14px]">#{o.code}</strong>
                <span className="ml-2 text-[12px] text-[#8A8A93]">{new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })} · {o.state}</span>
                <span className="block truncate text-[13px] text-[#C9C9CF]">{o.items.map((i) => `${i.title}${i.variant ? ` (${i.variant})` : ""} ×${i.qty}`).join(", ")}</span>
              </span>
              <span className="text-right">
                <strong className="block text-[14px] text-[#3DDC84] tabular-nums">{o.profit ? `+${ngn(o.profit)}` : "—"}</strong>
                <span className="text-[11px] text-[#8A8A93]">{o.bucket === "available" ? "Paid out Friday" : o.bucket === "paid_out" ? "Paid to you" : o.bucket === "void" ? "Cancelled" : "After delivery"}</span>
              </span>
              <StatusPill status={o.status} />
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-[12px] text-[#6B6B73]">Customer phone numbers and addresses stay private between them and FastChina.</p>
    </Page>
  );
}
