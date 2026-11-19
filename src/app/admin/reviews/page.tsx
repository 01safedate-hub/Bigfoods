import type { Metadata } from "next";
import Link from "next/link";
import { listReviews } from "@/lib/data/admin";
import { checkStaff } from "@/lib/supabase/auth";
import { ReviewActions } from "./review-actions";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const st = (await searchParams).status;
  const status = st === "published" || st === "hidden" ? st : "pending";
  const s = await checkStaff();
  const rows = (s.ok && !s.demo ? await listReviews(status) : null) ?? [];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Reviews</h1>
      <p className="text-[#5B6170]">Customers can review items from delivered orders. Check each one before it shows on the product. Publishing a photo review gives the customer 20 points.</p>
      <nav className="flex gap-1 border-b border-[#E3E5EA]">
        {(["pending", "published", "hidden"] as const).map((k) => (
          <Link key={k} href={`/admin/reviews?status=${k}`} aria-current={status === k ? "page" : undefined} className={`min-h-11 border-b-2 px-3.5 py-3 text-sm capitalize ${status === k ? "border-ink font-bold" : "border-transparent text-[#5B6170]"}`}>{k}</Link>
        ))}
      </nav>
      {rows.length === 0 ? <p className="rounded-lg border border-dashed border-[#C9CDD4] bg-white p-6 text-center text-[#5B6170]">Nothing here.</p> : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <strong>{"★".repeat(r.rating)}<span className="text-[#C9CDD4]">{"★".repeat(5 - r.rating)}</span></strong>
                <span className="font-semibold">{r.author}</span>
                <Link href={`/product/${r.slug}`} className="text-[#2563EB] underline">{r.product}</Link>
                <span className="text-xs text-[#5B6170]">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</span>
              </div>
              {r.body && <p>{r.body}</p>}
              {r.photos.length > 0 && (
                <div className="flex gap-1.5">
                  {r.photos.map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element -- moderation thumbnails
                    <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="size-16 rounded object-cover" /></a>
                  ))}
                </div>
              )}
              <ReviewActions id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
