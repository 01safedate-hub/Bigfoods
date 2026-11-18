import type { Metadata } from "next";
import { connection } from "next/server";
import { getPayouts, getSeller } from "@/lib/data/seller";
import { PLANS } from "@/lib/dropship/plans";
import { DemoNote, Gate } from "../_ui/gate";
import { Card, CardTitle, ngn, Page, Stat } from "../_ui/ui";
import { BankForm } from "./bank-form";

export const metadata: Metadata = { title: "Earnings" };

export default async function EarningsPage() {
  await connection();
  const state = await getSeller();
  if (state.kind !== "live" && state.kind !== "demo") return <Gate state={state} />;
  const d = state.data;
  const p = state.kind === "demo"
    ? { payouts: [{ id: "1", amount_ngn: 98_400, items: 17, status: "paid", created_at: "2026-11-13T09:00:00Z", paid_at: "2026-11-13T15:20:00Z" }, { id: "2", amount_ngn: 70_600, items: 12, status: "paid", created_at: "2026-11-06T09:00:00Z", paid_at: "2026-11-06T14:02:00Z" }], bank: { bank_name: "GTBank", account_number: "0123456789", account_name: "Ada Okafor" } }
    : await getPayouts();
  const fee = PLANS[d.store.plan].feePct;
  return (
    <Page title="Earnings" subtitle={`You keep your markup minus a ${fee}% fee that covers payments. Paid every Friday for delivered orders.`}>
      <DemoNote demo={state.kind === "demo"} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="On the way" value={ngn(d.earnings.pending)} sub="Paid once delivered" />
        <Stat label="Ready" value={ngn(d.earnings.available)} sub="In this Friday’s payout" tone="gold" />
        <Stat label="Paid to you" value={ngn(d.earnings.paid)} sub="All time" tone="green" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Payouts</CardTitle>
          {!p?.payouts.length && <p className="py-6 text-center text-[#8A8A93]">Your first payout arrives the Friday after your first delivered order (minimum ₦1,000).</p>}
          <ul>
            {p?.payouts.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 border-t border-white/5 py-3 first:border-0">
                <span>
                  <strong className="block text-[14px]">{new Date(x.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</strong>
                  <span className="text-[12px] text-[#8A8A93]">{x.items} items · {x.status === "paid" ? "Sent to your bank" : x.status === "failed" ? "Failed: check your account details" : "Processing"}</span>
                </span>
                <strong className="text-[16px] tabular-nums">{ngn(x.amount_ngn)}</strong>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Payout account</CardTitle>
          <BankForm initial={p?.bank ?? { bank_name: null, account_number: null, account_name: null }} />
        </Card>
      </div>
    </Page>
  );
}
