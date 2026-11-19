import type { Metadata } from "next";
import { listDraws } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Cart Clear-Out" };

export default async function DrawsPage() {
  const s = await checkStaff();
  const rows = (s.ok && !s.demo ? await listDraws() : null) ?? [];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Cart Clear-Out</h1>
      <p className="text-[#5B6170]">Weekly draws run themselves. Each draw publishes a commitment before it opens and reveals the seed after, so anyone can check the winners weren’t picked by hand. The prize budget is capped by the profit guard.</p>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#C9CDD4] bg-white p-6 text-center text-[#5B6170]">No draws yet. The first opens automatically at the start of the week.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E3E5EA] bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#F7F8FA] text-xs text-[#5B6170]"><tr>{["Week of", "Draw", "Status", "Entries", "Winners", "Budget", "Paid out", "Commitment"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.week_of} className="border-t border-[#EEF0F3]">
                  <td className="px-3 py-2.5 font-semibold">{d.week_of}</td>
                  <td className="px-3">{new Date(d.draw_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}</td>
                  <td className="px-3"><span className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-xs font-bold">{d.status}</span></td>
                  <td className="px-3 tabular-nums">{d.entries}</td>
                  <td className="px-3 tabular-nums">{d.winners}</td>
                  <td className="px-3 tabular-nums">{naira(d.budget_ngn)}</td>
                  <td className="px-3 tabular-nums">{naira(d.spent_ngn)}</td>
                  <td className="max-w-40 truncate px-3 font-mono text-xs" title={d.commitment}>{d.commitment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
