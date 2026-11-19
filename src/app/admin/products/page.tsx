import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { type AdminProduct, listAdminProducts } from "@/lib/data/admin";
import { naira } from "@/lib/format";
import { checkStaff } from "@/lib/supabase/auth";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Products" };

const SAMPLE: AdminProduct[] = [
  { slug: "satin-cowl-neck-midi-dress", title: "Satin cowl-neck midi dress", status: "active", source: "1688", price_list_min: 22_900, main_images: [], created_at: "2026-11-10T10:00:00Z", category: "Fashion" },
  { slug: "fc-signature-lash-kit-a1b2c", title: "FastChina signature lash kit", status: "draft", source: "custom", price_list_min: 8_400, main_images: [], created_at: "2026-11-18T09:00:00Z", category: "Beauty" },
];

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const f = { q: one(sp.q), status: one(sp.status), source: one(sp.source) };
  const s = await checkStaff();
  const rows = (s.ok && !s.demo ? await listAdminProducts(f) : null) ?? SAMPLE.filter((p) => (!f.status || p.status === f.status) && (!f.source || p.source === f.source));
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <Link href="/admin/products/new" className="flex min-h-10 items-center gap-1.5 rounded-md bg-ink px-4 font-bold text-white"><Plus aria-hidden size={16} /> Add product</Link>
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="pq">Product name</label>
        <input id="pq" name="q" defaultValue={f.q} placeholder="Search by name" className="min-h-10 min-w-0 flex-1 rounded-md border border-[#D0D4DB] bg-white px-3" />
        <select name="status" defaultValue={f.status} aria-label="Status" className="min-h-10 rounded-md border border-[#D0D4DB] bg-white px-2">
          <option value="">Any status</option>
          {["active", "draft", "hidden", "sold_out"].map((x) => <option key={x} value={x}>{x.replace("_", " ")}</option>)}
        </select>
        <select name="source" defaultValue={f.source} aria-label="Source" className="min-h-10 rounded-md border border-[#D0D4DB] bg-white px-2">
          <option value="">Any source</option>
          <option value="1688">1688 imports</option>
          <option value="custom">Custom</option>
        </select>
        <button type="submit" className="min-h-10 rounded-md bg-ink px-4 font-bold text-white">Search</button>
      </form>
      <p className="text-xs text-[#5B6170]">{rows.length} products{rows.length === 100 ? " (newest 100)" : ""}</p>
      <ul className="flex flex-col divide-y divide-[#EEF0F3] rounded-lg border border-[#E3E5EA] bg-white">
        {rows.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-center gap-3 p-3">
            <span className="relative size-12 shrink-0 overflow-hidden rounded bg-[#F4F5F7]">
              {p.main_images[0] && <Image src={p.main_images[0]} alt="" fill sizes="48px" className="object-cover" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <Link href={`/product/${p.slug}`} className="truncate font-bold hover:underline">{p.title}</Link>
              <span className="text-xs text-[#5B6170]">{p.category ?? "No category"} · {p.source === "custom" ? "Custom" : "1688"} · from {p.price_list_min ? naira(p.price_list_min) : "—"}</span>
            </span>
            <StatusSelect slug={p.slug} status={p.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
