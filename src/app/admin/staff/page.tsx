import type { Metadata } from "next";
import { listStaff, type StaffMember } from "@/lib/data/admin";
import { checkStaff } from "@/lib/supabase/auth";
import { RoleSelect } from "./role-select";

export const metadata: Metadata = { title: "Staff & roles" };

const SAMPLE: StaffMember[] = [
  { id: "s1", name: "You", email: "owner@fastchina.shop", phone: null, role: "super_admin", created_at: "2026-11-01T00:00:00Z" },
  { id: "s2", name: "Ada Okafor", email: "ada@fastchina.shop", phone: null, role: "purchasing", created_at: "2026-11-03T00:00:00Z" },
  { id: "s3", name: "Musa Bello", email: null, phone: "+2348030000002", role: "customer_care", created_at: "2026-11-05T00:00:00Z" },
];

const ROLE_HELP: Record<string, string> = {
  super_admin: "Everything, including roles and pricing rules",
  finance: "Pricing rules, refunds, dashboard",
  purchasing: "Purchase list, dispatch",
  warehouse: "Arrivals, photo checks, dispatch",
  customer_care: "Orders, Q&A, cancellations",
  marketing: "Coupons, events, stations",
  customer: "No admin access",
};

export default async function StaffPage({ searchParams }: PageProps<"/admin/staff">) {
  const q = (await searchParams).q;
  const search = Array.isArray(q) ? q[0] : q;
  const s = await checkStaff();
  const people = (s.ok && !s.demo ? await listStaff(search) : null) ?? SAMPLE;
  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Staff &amp; roles</h1>
        <p className="text-[#5B6170]">Only a Super admin can change roles. To add someone, ask them to sign in once, then search for their email or phone.</p>
      </div>
      <form role="search" className="flex gap-2">
        <input name="q" defaultValue={search} placeholder="Find a person by email or phone" aria-label="Find a person" className="min-h-10 min-w-0 flex-1 rounded-md border border-[#D0D4DB] bg-white px-3" />
        <button type="submit" className="min-h-10 rounded-md bg-ink px-4 font-bold text-white">Find</button>
      </form>
      <div className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
        {people.length === 0 && <p className="p-3.5 text-[#5B6170]">No one found. They need to sign in once first.</p>}
        {people.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 border-t border-[#EEF0F3] p-3.5 first:border-0">
            <span className="min-w-0 flex-1">
              <strong className="block truncate">{p.name ?? p.email ?? p.phone}</strong>
              <span className="text-xs text-[#5B6170]">{[p.email, p.phone].filter(Boolean).join(" · ")}</span>
            </span>
            <RoleSelect id={p.id} role={p.role} help={ROLE_HELP} />
          </div>
        ))}
      </div>
    </>
  );
}
