import type { Metadata } from "next";
import { type AdminStore, listStores } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";
import { StoreControls } from "./store-controls";

export const metadata: Metadata = { title: "Dropship sellers" };

const SAMPLE: AdminStore[] = [
  { id: "s1", slug: "adas-closet", name: "Ada’s Closet", plan: "free", plan_renews_at: null, status: "active", lifetime_sales_ngn: 1_386_400, custom_domain: null, domain_verified: false, created_at: "2026-11-01T10:00:00Z", products: 14, owner: "ada@example.com", payouts: [{ id: "p1", amount_ngn: 74_900, items: 12, status: "pending", created_at: "2026-11-20T09:00:00Z", bank_snapshot: { bank: "GTBank", account: "0123456789", name: "Ada Okafor" } }] },
  { id: "s2", slug: "volt", name: "VOLT", plan: "pro", plan_renews_at: "2026-12-18T00:00:00Z", status: "active", lifetime_sales_ngn: 4_920_000, custom_domain: "voltng.com", domain_verified: false, created_at: "2026-10-12T10:00:00Z", products: 88, owner: "tunde@example.com", payouts: [] },
];

export default async function SellersPage({ searchParams }: PageProps<"/admin/sellers">) {
  const q = (await searchParams).q;
  const search = typeof q === "string" ? q : "";
  const s = await checkStaff();
  const stores = (s.ok && !s.demo ? await listStores(search) : null) ?? SAMPLE;
  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Dropship sellers</h1>
        <p className="text-[#5B6170]">Activate plans (until card payments open), switch on own domains, pay sellers on Fridays, suspend stores that break the rules.</p>
      </div>
      <form role="search" className="flex gap-2">
        <input name="q" defaultValue={search} placeholder="Store name or address" aria-label="Find a store" className="min-h-10 min-w-0 flex-1 rounded-md border border-[#D0D4DB] bg-white px-3" />
        <button type="submit" className="min-h-10 rounded-md bg-ink px-4 font-bold text-white">Find</button>
      </form>
      <div className="flex flex-col gap-2">
        {stores.map((st) => (
          <details key={st.id} className="rounded-lg border border-[#E3E5EA] bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 p-3.5">
              <strong>{st.name}</strong>
              <span className="text-[#5B6170]">{st.slug}.fastchina.store</span>
              <span className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-xs font-bold uppercase">{st.plan}</span>
              {st.status !== "active" && <span className="rounded-full bg-[#FDECEC] px-2 py-0.5 text-xs font-bold text-[#B42318]">{st.status.replace("_", " ")}</span>}
              {st.payouts.length > 0 && <span className="rounded-full bg-[#FFF7E6] px-2 py-0.5 text-xs font-bold text-[#8A5300]">payout due</span>}
              <span className="ml-auto text-sm tabular-nums">{naira(st.lifetime_sales_ngn)} sold · {st.products} products</span>
            </summary>
            <StoreControls store={st} />
          </details>
        ))}
      </div>
    </>
  );
}
