import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMe } from "@/lib/data/me";
import { naira } from "@/lib/format";
import { userDb } from "@/lib/supabase/auth";
import { Panel, SettingsShell } from "../settings/ui";

export const metadata: Metadata = { title: "Wallet", robots: { index: false } };
const REASON: Record<string, string> = {
  plan_cancelled: "Plan cancelled, refunded", group_refund: "Group pay refund", order_refund: "Order refund",
  draw_win: "Cart Clear-Out prize", spend: "Spent at checkout", topup: "Top-up", adjustment: "Adjustment",
};

export default function WalletPage() {
  return (
    <SettingsShell title="Wallet" back="/account">
      <Suspense fallback={<div className="h-48 bg-white" />}>
        <Body />
      </Suspense>
    </SettingsShell>
  );
}

async function Body() {
  await connection();
  const me = await getMe();
  if (!me) redirect("/sign-in?mode=signin&next=/account/wallet");
  const { data } = await (await userDb()).from("wallet_ledger").select("amount_ngn, reason, created_at").order("created_at", { ascending: false }).limit(50);
  return (
    <>
      <Panel>
        <span className="text-[13px] text-muted">Balance</span>
        <strong className="-mt-3 text-[34px] tabular-nums">{naira(me.wallet)}</strong>
        <p className="text-[13px] text-muted">Refunds and prizes land here instantly. Use it at checkout on any order. Points: {me.points.toLocaleString("en-NG")} (100 points = ₦100 off).</p>
      </Panel>
      <Panel>
        <h2 className="text-[15px] font-bold">History</h2>
        {!data?.length ? <p className="text-[14px] text-muted">Nothing yet.</p> : (
          <ul className="flex flex-col divide-y divide-line">
            {data.map((w, i) => (
              <li key={i} className="flex justify-between gap-2 py-2.5 text-[14px]">
                <span>{REASON[w.reason] ?? w.reason}<span className="block text-[12px] text-muted">{new Date(w.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}</span></span>
                <strong className={w.amount_ngn > 0 ? "text-success" : ""}>{w.amount_ngn > 0 ? "+" : "−"}{naira(Math.abs(w.amount_ngn))}</strong>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
