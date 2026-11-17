import type { Metadata } from "next";
import { type AdminOrder, listOrders } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";
import { CancelButton } from "./cancel-button";

export const metadata: Metadata = { title: "Orders" };

const STATUSES = ["awaiting_payment", "part_paid", "paid", "purchasing", "purchased", "at_warehouse", "shipped", "delivered", "cancelled", "refunded"];
const SAMPLE: AdminOrder[] = [
  { id: "s1", code: "737012B0", status: "shipped", pay_mode: "full", total_ngn: 36_600, paid_ngn: 36_600, state: "Lagos", phone: "+2348030004412", created_at: "2026-11-05T10:00:00Z", items: [{ title: "Satin cowl-neck midi dress", variant_label: "Wine / M", qty: 1, unit_ngn: 22_900 }, { title: "Men’s quartz watch", variant_label: "Green", qty: 1, unit_ngn: 15_200 }] },
  { id: "s2", code: "4C19AE02", status: "part_paid", pay_mode: "small", total_ngn: 275_900, paid_ngn: 69_100, state: "FCT Abuja", phone: "+2348091112222", created_at: "2026-11-10T08:00:00Z", items: [{ title: "6.7\" AMOLED Android phone", variant_label: "Black / 256GB", qty: 1, unit_ngn: 275_900 }] },
  { id: "s3", code: "B7D0013F", status: "awaiting_payment", pay_mode: "group", total_ngn: 87_300, paid_ngn: 0, state: "Rivers", phone: "+2348123334444", created_at: "2026-11-16T19:00:00Z", items: [{ title: "Body wave lace front wig", variant_label: "22\"", qty: 1, unit_ngn: 87_300 }] },
];
const PAY = { full: "Paid in full", small: "Small small", group: "Group pay" } as Record<string, string>;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const f = { q: one(sp.q), status: one(sp.status), state: one(sp.state) };
  const s = await checkStaff();
  const orders = (s.ok && !s.demo ? await listOrders(f) : null) ?? SAMPLE.filter((o) => (!f.status || o.status === f.status) && (!f.q || o.code.includes(f.q.toUpperCase()) || o.phone?.includes(f.q)));
  return (
    <>
      <h1 className="text-2xl font-extrabold">Orders</h1>
      <form className="flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="oq">Order code or phone</label>
        <input id="oq" name="q" defaultValue={f.q} placeholder="Order code or phone" className="min-h-10 min-w-0 flex-1 rounded-md border border-[#D0D4DB] bg-white px-3" />
        <label className="sr-only" htmlFor="os">Status</label>
        <select id="os" name="status" defaultValue={f.status} className="min-h-10 rounded-md border border-[#D0D4DB] bg-white px-2">
          <option value="">Any status</option>
          {STATUSES.map((st) => <option key={st} value={st}>{st.replace("_", " ")}</option>)}
        </select>
        <input name="state" defaultValue={f.state} placeholder="State" aria-label="State" className="min-h-10 w-32 rounded-md border border-[#D0D4DB] bg-white px-3" />
        <button type="submit" className="min-h-10 rounded-md bg-ink px-4 font-bold text-white">Search</button>
      </form>
      <p className="text-xs text-[#5B6170]">{orders.length} orders{orders.length === 100 ? " (newest 100)" : ""}</p>
      <div className="flex flex-col gap-2">
        {orders.map((o) => (
          <details key={o.id} className="rounded-lg border border-[#E3E5EA] bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 p-3.5">
              <strong className="font-mono">#{o.code}</strong>
              <span className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-xs font-bold">{o.status.replace("_", " ")}</span>
              <span className="text-[#5B6170]">{PAY[o.pay_mode]} · {o.state}</span>
              <span className="ml-auto tabular-nums"><strong>{naira(o.total_ngn)}</strong>{o.paid_ngn < o.total_ngn && <span className="text-xs text-[#5B6170]"> · {naira(o.paid_ngn)} paid</span>}</span>
            </summary>
            <div className="flex flex-col gap-2 border-t border-[#EEF0F3] p-3.5">
              {o.items.map((i, k) => (
                <div key={k} className="flex justify-between gap-2"><span>{i.title} <span className="text-xs text-[#5B6170]">{i.variant_label} ×{i.qty}</span></span><span className="tabular-nums">{naira(i.unit_ngn * i.qty)}</span></div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#5B6170]">
                <span>{o.phone} · placed {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</span>
                {["awaiting_payment", "part_paid", "paid", "purchasing", "shipped"].includes(o.status) && <CancelButton id={o.id} refund={o.status === "shipped"} paid={o.paid_ngn} />}
              </div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
