import type { Metadata } from "next";
import Link from "next/link";
import { getStockBoard, type StockFilters } from "@/lib/data/stock";
import { checkStaff } from "@/lib/supabase/auth";
import { cn, naira } from "@/lib/format";
import { GuideCard } from "../guide/guide-card";
import { REASON_LABEL } from "../money";
import { BuyTab } from "./buy-tab";
import { ExpectedTab } from "./expected-tab";
import { ReturnsTab } from "./returns-tab";
import { SendTab } from "./send-tab";

export const metadata: Metadata = { title: "Purchasing & dispatch" };

const TABS = [
  { id: "buy", label: "1 · Buy" },
  { id: "expected", label: "2 · Expected goods" },
  { id: "send", label: "3 · Ready to send" },
  { id: "sent", label: "4 · Sent" },
  { id: "returns", label: "Not collected" },
  { id: "stock", label: "Stock" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function PurchasingPage({ searchParams }: PageProps<"/admin/purchasing">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tab: Tab = (TABS.find((t) => t.id === one(sp.tab))?.id ?? "buy") as Tab;
  const f: StockFilters = { state: one(sp.state), from: one(sp.from), to: one(sp.to), show: (["ready", "waiting", "all"].includes(one(sp.show)) ? one(sp.show) : "ready") as StockFilters["show"] };
  const s = await checkStaff();
  const b = s.ok && !s.demo ? await getStockBoard(f) : null;

  const short = b?.buy.reduce((n, r) => n + r.short, 0) ?? 0;
  const expected = b?.purchases.filter((p) => p.status === "expected").reduce((n, p) => n + p.lines.reduce((m, l) => m + l.qty, 0), 0) ?? 0;
  const spare = b?.stock.reduce((n, r) => n + Math.max(0, r.on_hand - r.on_hand_assigned), 0) ?? 0;
  const stockValue = b?.stock.reduce((n, r) => n + r.on_hand * r.avg, 0) ?? 0;

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Purchasing &amp; dispatch</h1>
        <p className="text-[#5B6170]">Buy → goods expected → goods arrive → send complete orders → record anything not collected</p>
      </div>
      <GuideCard page="purchasing" />

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          ["Units still to buy", String(short), "paid orders with no goods yet", "buy"],
          ["Units expected", String(expected), "bought, not arrived", "expected"],
          ["Spare in stock", String(spare), `stock worth ${naira(stockValue)}`, "stock"],
          ["Orders ready to send", f.show === "ready" ? String(b?.queue.length ?? 0) : "—", "every unit has arrived", "send"],
        ].map(([l, v, sub, t]) => (
          <Link key={l} href={`?tab=${t}`} className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-white p-3.5 hover:border-ink">
            <span className="text-xs text-[#5B6170]">{l}</span>
            <strong className="text-[22px] tabular-nums">{v}</strong>
            <span className="text-[11px] text-[#5B6170]">{sub}</span>
          </Link>
        ))}
      </section>

      <nav aria-label="Steps" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[#E3E5EA]">
        {TABS.map((t) => (
          <Link key={t.id} href={`?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined}
            className={cn("flex min-h-11 items-center whitespace-nowrap border-b-2 px-3.5 text-sm", tab === t.id ? "border-ink font-bold" : "border-transparent text-[#5B6170]")}>
            {t.label}
          </Link>
        ))}
      </nav>

      {!b && <p className="rounded-lg border border-[#E3E5EA] bg-white p-4 text-[#5B6170]">Connect the database to use this screen. In demo mode nothing is saved.</p>}

      {b && tab === "buy" && <BuyTab rows={b.buy} />}
      {b && tab === "expected" && <ExpectedTab purchases={b.purchases} />}
      {b && tab === "send" && <SendTab orders={b.queue} states={b.states} filters={f} />}
      {b && tab === "returns" && <ReturnsTab />}

      {b && tab === "returns" && (
        <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
          <strong className="border-b border-[#EEF0F3] p-3.5">Recent not collected &amp; returns</strong>
          {b.returns.length === 0 && <p className="p-3.5 text-[#5B6170]">Nothing recorded yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <tbody>
                {b.returns.map((r) => (
                  <tr key={r.id} className="border-t border-[#EEF0F3] first:border-0">
                    <td className="px-3.5 py-2.5 text-[#5B6170]">{day(r.at)}</td>
                    <td className="px-3.5 py-2.5"><strong className="font-mono">#{r.code}</strong><span className="block text-xs text-[#5B6170]">{r.name ?? r.phone}</span></td>
                    <td className="px-3.5 py-2.5">{r.title} ×{r.qty}<span className="block text-xs text-[#5B6170]">{REASON_LABEL[r.reason]}{r.note ? ` · ${r.note}` : ""}</span></td>
                    <td className="px-3.5 py-2.5 tabular-nums">Refunded <strong>{naira(r.refund)}</strong>{r.fee > 0 && <span className="block text-xs text-[#5B6170]">Return fee {naira(r.fee)}</span>}</td>
                    <td className="px-3.5 py-2.5 text-xs">{r.restocked ? <span className="rounded-full bg-success-soft px-2 py-1 font-bold text-success">Back in stock</span> : <span className="text-[#5B6170]">Not restocked</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {b && tab === "sent" && (
        <section className="flex flex-col gap-2">
          {b.dispatches.length === 0 && <p className="rounded-lg border border-[#E3E5EA] bg-white p-4 text-[#5B6170]">Nothing sent yet. Send complete orders from “Ready to send”.</p>}
          {b.dispatches.map((d) => (
            <details key={d.id} className="rounded-lg border border-[#E3E5EA] bg-white">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 p-3.5">
                <strong className="font-mono">{d.ref}</strong>
                <span>{day(d.sent_on)} · {d.carrier} · {d.state}</span>
                <span className="text-[#5B6170]">{d.orders.length} {d.orders.length === 1 ? "order" : "orders"}</span>
                <span className="ml-auto tabular-nums">Shipping <strong>{naira(d.total)}</strong></span>
              </summary>
              <div className="overflow-x-auto border-t border-[#EEF0F3]">
                <table className="w-full min-w-[600px] text-left">
                  <tbody>
                    {d.orders.map((o) => (
                      <tr key={o.code} className="border-t border-[#F1F2F4] first:border-0">
                        <td className="px-3.5 py-2"><span className="font-mono">#{o.code}</span></td>
                        <td className="px-3.5 py-2">{o.name ?? "—"}<span className="block text-xs text-[#5B6170]">{o.state}</span></td>
                        <td className="px-3.5 py-2 text-xs text-[#5B6170]">{o.tracking ?? "no tracking no."}</td>
                        <td className="px-3.5 py-2 text-xs">{o.status.replace("_", " ")}</td>
                        <td className="px-3.5 py-2 text-right tabular-nums">{naira(o.cost)}</td>
                      </tr>
                    ))}
                    {d.extra > 0 && <tr className="border-t border-[#F1F2F4]"><td colSpan={4} className="px-3.5 py-2 text-[#5B6170]">Extra cost (transport to hub, packing…)</td><td className="px-3.5 py-2 text-right tabular-nums">{naira(d.extra)}</td></tr>}
                  </tbody>
                </table>
                {d.note && <p className="border-t border-[#F1F2F4] px-3.5 py-2 text-xs text-[#5B6170]">{d.note}</p>}
              </div>
            </details>
          ))}
        </section>
      )}

      {b && tab === "stock" && (
        <section className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
          <p className="border-b border-[#EEF0F3] p-3.5 text-[#5B6170]">Goods go down as you send them. <strong className="text-ink">Spare</strong> is in the warehouse with no customer yet: it goes to the next person who pays for it.</p>
          {b.stock.length === 0 && <p className="p-3.5 text-[#5B6170]">No purchases recorded yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead><tr className="text-xs text-[#5B6170]">{["Product", "Expected", "In warehouse", "…for customers", "Spare", "Sent", "Still to buy", "Avg landed cost"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {b.stock.map((r) => (
                  <tr key={r.sku_id} className="border-t border-[#EEF0F3] tabular-nums">
                    <td className="px-3 py-2.5"><strong className="block font-semibold">{r.title}</strong><span className="text-xs text-[#5B6170]">{r.variant || "—"}</span></td>
                    <td className="px-3 py-2.5">{r.expected}</td>
                    <td className="px-3 py-2.5 font-bold">{r.on_hand}</td>
                    <td className="px-3 py-2.5">{r.on_hand_assigned}</td>
                    <td className={cn("px-3 py-2.5", r.on_hand - r.on_hand_assigned > 0 && "font-bold text-success")}>{Math.max(0, r.on_hand - r.on_hand_assigned)}</td>
                    <td className="px-3 py-2.5">{r.sent}</td>
                    <td className={cn("px-3 py-2.5", r.short > 0 && "font-bold text-sale")}>{r.short}</td>
                    <td className="px-3 py-2.5">{r.avg ? naira(r.avg) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
