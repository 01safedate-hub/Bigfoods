import type { Metadata } from "next";
import Link from "next/link";
import { getAccounts, type Report } from "@/lib/data/stock";
import { checkStaff } from "@/lib/supabase/auth";
import { cn, naira } from "@/lib/format";
import { GuideCard } from "../guide/guide-card";
import { EXPENSE_LABEL } from "../money";
import { ExpenseForm, RemoveExpense } from "./expense-form";

export const metadata: Metadata = { title: "Accounts" };

const iso = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
function presets() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  const y = now.getFullYear(), m = now.getMonth();
  const d = (yy: number, mm: number, dd: number) => iso(new Date(Date.UTC(yy, mm, dd, 12)));
  return [
    { label: "This month", from: d(y, m, 1), to: iso(new Date()) },
    { label: "Last month", from: d(y, m - 1, 1), to: d(y, m, 0) },
    { label: "Last 30 days", from: iso(new Date(Date.now() - 29 * 86_400_000)), to: iso(new Date()) },
    { label: "This year", from: d(y, 0, 1), to: iso(new Date()) },
  ];
}
const day = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Row({ label, value, sub, minus, strong, tone }: { label: string; value: number; sub?: string; minus?: boolean; strong?: boolean; tone?: "good" | "bad" }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 px-3.5 py-2", strong && "border-t border-[#E3E5EA] bg-[#F8F9FA]")}>
      <span className={strong ? "font-bold" : ""}>{label}{sub && <span className="block text-xs font-normal text-[#5B6170]">{sub}</span>}</span>
      <span className={cn("tabular-nums", strong && "text-base font-extrabold", tone === "good" && "text-success", tone === "bad" && "text-sale")}>{minus && value ? "−" : ""}{naira(value)}</span>
    </div>
  );
}

export default async function AccountsPage({ searchParams }: PageProps<"/admin/accounts">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const ok = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
  const p = presets();
  const from = ok(one(sp.from)) ? one(sp.from) : p[0].from;
  const to = ok(one(sp.to)) ? one(sp.to) : p[0].to;
  const cat = one(sp.cat);
  const s = await checkStaff();
  const data = s.ok && !s.demo ? await getAccounts(from, to, cat || undefined) : null;
  const r: Report | null = data?.report ?? null;

  const netSales = r ? r.sales - r.refunds : 0;
  const goods = r ? r.goods_actual + r.goods_estimated - r.restocked : 0;
  const gross = netSales - goods - (r?.seller_share ?? 0);
  const running = r ? r.shipping_out + r.returns_fees + r.other_expenses : 0;
  const net = gross - running;
  const margin = netSales ? Math.round((net / netSales) * 100) : 0;

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Accounts</h1>
        <p className="text-[#5B6170]">Real profit: what customers paid, minus refunds, the real landed cost of the goods, shipping out and every other expense.</p>
      </div>
      <GuideCard page="accounts" />

      <form className="flex flex-wrap items-end gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3">
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">From<input type="date" name="from" defaultValue={from} className="min-h-10 rounded-md border border-[#D0D4DB] px-2.5 text-sm text-ink" /></label>
        <label className="flex flex-col gap-1 text-xs text-[#5B6170]">To<input type="date" name="to" defaultValue={to} className="min-h-10 rounded-md border border-[#D0D4DB] px-2.5 text-sm text-ink" /></label>
        <button type="submit" className="min-h-10 rounded-md bg-ink px-4 font-bold text-white">Show</button>
        <span className="flex flex-wrap gap-1.5 sm:ml-auto">
          {p.map((x) => (
            <Link key={x.label} href={`?from=${x.from}&to=${x.to}`} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", x.from === from && x.to === to ? "border-ink bg-ink text-white" : "border-[#D0D4DB] bg-white")}>{x.label}</Link>
          ))}
        </span>
      </form>

      {!r && <p className="rounded-lg border border-[#E3E5EA] bg-white p-4 text-[#5B6170]">Connect the database to see accounts. In demo mode nothing is saved.</p>}

      {r && (
        <>
          <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {[
              ["Net sales", naira(netSales), `${r.orders} paid orders · ${day(from)} – ${day(to)}`],
              ["Profit", naira(net), `${margin}% of net sales`],
              ["Spent buying goods", naira(r.spend_goods + r.spend_fees), `${r.purchases} purchases · ${naira(r.spend_fees)} fees`],
              ["Stock on hand", naira(r.stock_value), `${r.stock_units} units here · ${r.expected_units} on the way`],
            ].map(([k, v, sub], i) => (
              <div key={k} className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
                <span className="text-xs text-[#5B6170]">{k}</span>
                <strong className={cn("text-xl tabular-nums", i === 1 && (net >= 0 ? "text-success" : "text-sale"))}>{v}</strong>
                <span className="text-xs text-[#5B6170]">{sub}</span>
              </div>
            ))}
          </section>

          <section className="grid gap-2.5 lg:grid-cols-[3fr_2fr]">
            <div className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white py-1.5">
              <strong className="px-3.5 py-2">Profit &amp; loss</strong>
              <Row label="Sales" sub={`Orders fully paid in this period${r.wholesale_sales ? ` (wholesale ${naira(r.wholesale_sales)})` : ""}`} value={r.sales} />
              <Row label="Refunds" sub={`Cancellations and ${r.returns} not collected / returned`} value={r.refunds} minus />
              <Row label="Net sales" value={netSales} strong />
              <Row label="Goods cost (real)" sub="Landed cost of the units given to these orders: price + freight, customs, agent fees" value={r.goods_actual} minus />
              {r.goods_estimated > 0 && <Row label="Goods cost (estimated)" sub="Units not bought yet, at the planned cost" value={r.goods_estimated} minus />}
              {r.restocked > 0 && <Row label="Goods returned to stock" sub="Not-collected goods back on the shelf" value={r.restocked} tone="good" />}
              {r.seller_share > 0 && <Row label="Dropship sellers’ share" value={r.seller_share} minus />}
              <Row label="Gross profit" value={gross} strong />
              <Row label="Shipping out" sub={`Jumia and local delivery · ${r.shipped_orders} orders sent`} value={r.shipping_out} minus />
              {r.returns_fees > 0 && <Row label="Return fees" value={r.returns_fees} minus />}
              {Object.entries(r.expenses_by_category).filter(([c]) => c !== "local_shipping" && c !== "returns").map(([c, v]) => <Row key={c} label={EXPENSE_LABEL[c] ?? c} value={v} minus />)}
              <Row label="Profit" value={net} strong tone={net >= 0 ? "good" : "bad"} />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1.5 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
                <strong>Buying in this period</strong>
                <span className="flex justify-between"><span>Goods</span><span className="tabular-nums">{naira(r.spend_goods)}</span></span>
                {Object.entries(r.purchase_fees_by_category).map(([c, v]) => <span key={c} className="flex justify-between text-[#5B6170]"><span>{EXPENSE_LABEL[c] ?? c}</span><span className="tabular-nums">{naira(v)}</span></span>)}
                <span className="text-xs text-[#5B6170]">These fees are already inside “Goods cost (real)” as the goods sell, so they aren’t counted twice.</span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
                <strong>Watch</strong>
                <span className="flex justify-between"><span>Refunds still to pay (guests)</span><span className="tabular-nums font-semibold text-sale">{naira(r.refunds_pending)}</span></span>
                <span className="flex justify-between"><span>Stock value</span><span className="tabular-nums">{naira(r.stock_value)}</span></span>
              </div>
              <ExpenseForm />
            </div>
          </section>

          <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF0F3] p-3.5">
              <strong className="mr-auto">Expenses in this period</strong>
              <form className="flex gap-2">
                <input type="hidden" name="from" value={from} /><input type="hidden" name="to" value={to} />
                <select name="cat" defaultValue={cat} aria-label="Category" className="min-h-9 rounded-md border border-[#D0D4DB] px-2 text-xs">
                  <option value="">All categories</option>{Object.entries(EXPENSE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button type="submit" className="min-h-9 rounded-md border border-[#D0D4DB] px-3 text-xs font-semibold">Filter</button>
              </form>
            </div>
            {data!.expenses.length === 0 && <p className="p-3.5 text-[#5B6170]">No expenses in this period.</p>}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <tbody>
                  {data!.expenses.map((e) => (
                    <tr key={e.id} className="border-t border-[#F1F2F4] first:border-0">
                      <td className="px-3.5 py-2 text-[#5B6170]">{day(e.spent_on)}</td>
                      <td className="px-3.5 py-2">{EXPENSE_LABEL[e.category] ?? e.category}{e.note && <span className="block text-xs text-[#5B6170]">{e.note}</span>}</td>
                      <td className="px-3.5 py-2 text-xs">{e.link ? <span className="rounded bg-[#F4F5F7] px-1.5 py-0.5 font-mono">{e.link}</span> : <span className="text-[#5B6170]">entered by hand</span>}</td>
                      <td className="px-3.5 py-2 text-right font-semibold tabular-nums">{naira(e.amount_ngn)}</td>
                      <td className="w-10 px-2 py-2">{e.manual && <RemoveExpense id={e.id} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
