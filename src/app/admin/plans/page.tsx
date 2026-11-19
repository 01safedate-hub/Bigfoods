import type { Metadata } from "next";
import Link from "next/link";
import { listPlans } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Group pay & plans" };

export default async function PlansPage() {
  const s = await checkStaff();
  const rows = (s.ok && !s.demo ? await listPlans() : null) ?? [];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Group pay &amp; plans</h1>
      <p className="text-[#5B6170]">Pay small small plans cancel themselves 14 days after a missed payment, and Group pay links close after 7 days; money goes back to wallets automatically.</p>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#C9CDD4] bg-white p-6 text-center text-[#5B6170]">No plans or Group pay links yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E3E5EA] bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#F7F8FA] text-xs text-[#5B6170]"><tr>{["Order", "Type", "Status", "Detail", "Paid", "Total", "Started"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.kind}-${r.code}`} className="border-t border-[#EEF0F3]">
                  <td className="px-3 py-2.5"><Link href={`/admin/orders?q=${r.code}`} className="font-mono font-bold underline">#{r.code}</Link></td>
                  <td className="px-3">{r.kind === "small" ? "Pay small small" : "Group pay"}</td>
                  <td className="px-3"><span className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-xs font-bold">{r.status}</span></td>
                  <td className="px-3 text-[#5B6170]">{r.detail}</td>
                  <td className="px-3 tabular-nums">{naira(r.paid)}</td>
                  <td className="px-3 tabular-nums font-bold">{naira(r.total)}</td>
                  <td className="px-3 text-[#5B6170]">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
