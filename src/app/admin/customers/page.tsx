import type { Metadata } from "next";
import { listCustomers } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const q = (await searchParams).q;
  const term = typeof q === "string" ? q : "";
  const s = await checkStaff();
  const rows = (s.ok && !s.demo ? await listCustomers(term) : null) ?? [];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Customers</h1>
      <form role="search" className="flex gap-2">
        <input name="q" defaultValue={term} placeholder="Name, email or phone" aria-label="Search customers" className="min-h-10 min-w-0 flex-1 rounded-md border border-[#D0D4DB] bg-white px-3" />
        <button type="submit" className="min-h-10 rounded-md bg-ink px-4 font-bold text-white">Search</button>
      </form>
      <p className="text-xs text-[#5B6170]">{rows.length} accounts{s.ok && s.demo ? " · demo mode: connect the database to see customers" : ""}. Change staff roles under Staff &amp; roles.</p>
      <div className="overflow-x-auto rounded-lg border border-[#E3E5EA] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#F7F8FA] text-xs text-[#5B6170]"><tr>{["Name", "Email", "Phone", "Role", "Orders", "Paid", "Station", "Joined"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#EEF0F3]">
                <td className="px-3 py-2.5 font-semibold">{c.name ?? "—"}</td>
                <td className="px-3">{c.email ?? "—"}</td>
                <td className="px-3">{c.phone ?? "—"}</td>
                <td className="px-3"><span className={c.role === "customer" ? "" : "rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white"}>{c.role.replace("_", " ")}</span></td>
                <td className="px-3 tabular-nums">{c.orders}</td>
                <td className="px-3 tabular-nums">{naira(c.spent)}</td>
                <td className="px-3 text-xs">{c.station ?? "—"}</td>
                <td className="px-3 text-[#5B6170]">{new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
