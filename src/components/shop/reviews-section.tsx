import { BadgeCheck, Star } from "lucide-react";
import Image from "next/image";
import type { Review } from "@/lib/data/catalog";

/** Published customer reviews (verified: only buyers of delivered orders can review). */
export function ReviewsSection({ reviews, rating, count }: { reviews: Review[]; rating: number; count: number }) {
  if (!reviews.length) return null;
  const withPhotos = reviews.flatMap((r) => r.photos).slice(0, 10);
  return (
    <section aria-labelledby="rv-h" className="flex flex-col gap-3 bg-white px-3 py-4 md:rounded-lg md:border md:border-line md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="rv-h" className="flex items-center gap-2 text-[16px] font-extrabold">
          {rating.toFixed(1)} <Star aria-hidden size={16} className="fill-ink" /> <span className="font-semibold text-muted">({count} reviews)</span>
        </h2>
        <span className="flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-[12px] font-semibold text-success"><BadgeCheck aria-hidden size={14} /> All reviews are from verified purchases</span>
      </div>
      {withPhotos.length > 0 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {withPhotos.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Image src={u} alt="Customer photo" fill sizes="80px" className="object-cover" />
            </a>
          ))}
        </div>
      )}
      <ul className="flex flex-col divide-y divide-line">
        {reviews.slice(0, 6).map((r) => (
          <li key={r.id} className="flex flex-col gap-1 py-3">
            <span className="flex items-center gap-2 text-[13px]">
              <strong>{r.author}</strong>
              <span aria-label={`${r.rating} stars`} className="tracking-tight">{"★".repeat(r.rating)}<span className="text-subtle">{"★".repeat(5 - r.rating)}</span></span>
            </span>
            {r.variant && <span className="text-[12px] text-muted">Bought: {r.variant}</span>}
            {r.body && <p className="text-[14px] leading-relaxed">{r.body}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
