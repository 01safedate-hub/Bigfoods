"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { Fragment, useState } from "react";
import { PromoTile } from "@/components/shop/feed-promos";
import { ProductCard } from "@/components/shop/product-card";
import { ProductIcon } from "@/components/ui/product-icon";
import { departmentBySlug, inSub } from "@/lib/catalog/departments";
import type { IconKey, Product } from "@/lib/catalog/types";
import { cn } from "@/lib/format";

interface Circle { slug: string; label: string; icon: IconKey; image: string | null; count: number }

/** A department page, Temu style: a row of circles for its categories, then the products. */
export function DepartmentView({ dept, circles, products }: { dept: { slug: string; title: string; intro: string }; circles: Circle[]; products: Product[] }) {
  const [sub, setSub] = useState<string | null>(null);
  const d = departmentBySlug(dept.slug)!;
  const group = sub ? d.subs.find((s) => s.slug === sub) : undefined;
  const list = group ? products.filter((p) => inSub(group, p)) : products;
  const photos = products.flatMap((p) => p.images.slice(0, 1)).slice(0, 24);

  return (
    <div className="flex flex-col gap-3 pb-24 md:gap-5 md:pt-5 md:pb-10">
      <div className="flex items-center gap-4 overflow-x-auto bg-[#FFF4E5] px-3 py-2 text-[12px] font-semibold text-success no-scrollbar md:rounded-lg md:text-[13px]">
        {["Free shipping", "Delivered or refunded", "No hidden fees", "Price locked at checkout"].map((t) => (
          <span key={t} className="flex shrink-0 items-center gap-1"><Check aria-hidden size={14} strokeWidth={3} /> {t}</span>
        ))}
      </div>

      <div className="flex flex-col gap-1 px-3 md:px-0">
        <h1 className="text-[20px] font-extrabold md:text-[26px]">{dept.title}</h1>
        <p className="hidden text-muted md:block">{dept.intro}</p>
      </div>

      {circles.length > 0 && (
        <nav aria-label={`${dept.title} categories`} className="no-scrollbar flex gap-3 overflow-x-auto px-3 md:flex-wrap md:gap-5 md:overflow-visible md:px-0">
          {circles.map((c) => {
            const on = sub === c.slug;
            return (
              <button key={c.slug} type="button" aria-pressed={on} onClick={() => setSub(on ? null : c.slug)} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 md:w-[96px]">
                <span className={cn("relative flex size-[68px] items-center justify-center overflow-hidden rounded-full bg-surface ring-2 transition md:size-[88px]", on ? "ring-ink" : "ring-transparent")}>
                  {c.image ? <Image src={c.image} alt="" fill sizes="88px" className="object-cover" /> : <ProductIcon icon={c.icon} size={30} />}
                </span>
                <span className={cn("line-clamp-2 text-center text-[12px] leading-tight md:text-[13px]", on ? "font-extrabold" : "text-[#444]")}>{c.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {sub && (
        <div className="flex items-center justify-between px-3 text-[13px] md:px-0">
          <span><strong>{group?.label}</strong> · {list.length} items</span>
          <button type="button" onClick={() => setSub(null)} className="font-bold underline">Show all</button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="px-3 py-10 text-center text-muted">New items arrive daily. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 px-1.5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:gap-y-5 md:px-0 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((p, i) => (
            <Fragment key={p.slug}>
              <ProductCard product={p} />
              {(i + 1) % 10 === 4 && <PromoTile slot={i + 2} images={photos} />}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
