import { LogIn } from "lucide-react";
import Link from "next/link";
import { naira } from "@/lib/format";
import { trackingStep, type OrderStatus } from "@/lib/orders/lifecycle";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { signOut } from "../actions";

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
  const { data: orders } = await (await userDb())
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
