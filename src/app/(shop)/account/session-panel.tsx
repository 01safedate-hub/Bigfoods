import { LogIn } from "lucide-react";
import Link from "next/link";
import { naira } from "@/lib/format";
import { trackingStep, type OrderStatus } from "@/lib/orders/lifecycle";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { signOut } from "../actions";
import { CheckInButton } from "./check-in-button";

const REASON: Record<string, string> = {
  plan_cancelled: "Plan cancelled, refunded", group_refund: "Group pay refund", order_refund: "Order refund",
  draw_win: "Cart Clear-Out prize", spend: "Spent", topup: "Top-up", adjustment: "Adjustment",
};

/** Signed-in state and the customer's real orders (row level security returns only their own). */
export async function SessionPanel() {
  if (!hasSupabase) return null;
  const user = await getSessionUser();
  if (!user) {
    return (
      <Link href="/sign-in?next=/account" className="mx-3 flex items-center gap-3 rounded-lg bg-ink p-4 text-white md:mx-0">
        <LogIn aria-hidden size={22} />
        <span className="flex-1">
          <strong className="block">Sign in or join</strong>
          <span className="text-xs text-white/75">Track orders, keep your points and use your wallet.</span>
        </span>
        <span className="text-xs font-extrabold">GO ›</span>
      </Link>
    );
  }
  const db = await userDb();
  const [{ data: bal }, { data: wallet }] = await Promise.all([
    db.from("my_balances").select("wallet_ngn, points").maybeSingle(),
    db.from("wallet_ledger").select("amount_ngn, reason, created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const { data: orders } = await db
    .from("orders")
    .select("code, status, total_ngn, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <section className="mx-3 flex flex-col gap-2 rounded-lg border border-line bg-white p-3.5 md:mx-0">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <strong className="block truncate">{user.email ?? user.phone}</strong>
          <span className="text-xs text-muted">Signed in</span>
        </span>
        <form action={signOut}>
          <button type="submit" className="min-h-9 rounded border border-black/20 px-3 text-xs font-bold">Sign out</button>
        </form>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="flex flex-col rounded-md bg-surface p-3">
          <span className="text-xs text-muted">Wallet</span>
          <strong className="text-lg">{naira(bal?.wallet_ngn ?? 0)}</strong>
          <span className="text-[11px] text-muted">Refunds and prizes · spend at checkout</span>
        </div>
        <div className="flex flex-col rounded-md bg-surface p-3">
          <span className="text-xs text-muted">Points</span>
          <strong className="text-lg">{(bal?.points ?? 0).toLocaleString("en-NG")}</strong>
          <span className="text-[11px] text-muted">100 points = ₦100 off</span>
        </div>
      </div>
      <CheckInButton />
      {!!wallet?.length && (
        <details className="text-xs">
          <summary className="cursor-pointer py-1 font-bold">Wallet history</summary>
          {wallet.map((w, i) => (
            <div key={i} className="flex justify-between border-t border-line py-1.5">
              <span>{REASON[w.reason] ?? w.reason} · {new Date(w.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</span>
              <strong className={w.amount_ngn > 0 ? "text-success" : ""}>{w.amount_ngn > 0 ? "+" : "−"}{naira(Math.abs(w.amount_ngn))}</strong>
            </div>
          ))}
        </details>
      )}
      <h2 className="pt-1 text-sm font-extrabold">My orders</h2>
      {!orders?.length && <p className="text-muted">No orders yet.</p>}
      {orders?.map((o) => (
        <Link key={o.code} href={`/track?code=${o.code}`} className="flex items-center justify-between gap-2 border-t border-line py-2">
          <span>
            <strong className="font-mono text-[13px]">#{o.code}</strong>
            <span className="block text-xs text-muted">{trackingStep(o.status as OrderStatus).label}</span>
          </span>
          <strong>{naira(o.total_ngn)}</strong>
        </Link>
      ))}
    </section>
  );
}
