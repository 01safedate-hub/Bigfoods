import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { GUIDES, readMinutes } from "@/lib/content/guides";
import { breadcrumbs, graph, SHOP_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides: Importing from China & Dropshipping in Nigeria",
  description: "Free, practical guides on importing from China to Nigeria, buying from 1688, shipping costs, wholesale buying and starting a dropshipping business for free.",
  alternates: { canonical: "/guides" },
  openGraph: { type: "website", url: "/guides", title: "FastChina Guides: import from China, start dropshipping" },
};

const TOPICS = ["Dropshipping", "Importing", "Wholesale", "Buying guides"] as const;

export default function GuidesPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 md:py-12">
      <JsonLd
        data={graph(
          breadcrumbs([["Home", "/"], ["Guides", "/guides"]]),
          {
            "@type": "CollectionPage",
            "@id": `${SHOP_URL}/guides`,
            name: "FastChina guides",
            hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.h1, url: `${SHOP_URL}/guides/${g.slug}` })),
          },
        )}
      />
      <header className="flex flex-col gap-3">
        <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.14em] text-success"><BookOpen aria-hidden size={14} /> FASTCHINA GUIDES</span>
        <h1 className="max-w-3xl text-[30px] font-extrabold leading-tight tracking-tight md:text-[44px]">Import from China and start selling in Nigeria</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">Plain answers to the questions people ask before their first import or their first sale. Written by the team that buys, checks and ships orders from China every day.</p>
      </header>

      {TOPICS.map((topic) => {
        const list = GUIDES.filter((g) => g.topic === topic);
        if (!list.length) return null;
        return (
          <section key={topic} aria-labelledby={`t-${topic}`} className="flex flex-col gap-3">
            <h2 id={`t-${topic}`} className="text-lg font-extrabold">{topic}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {list.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col gap-2 rounded-2xl border border-line p-5 transition-colors hover:border-ink">
                    <strong className="text-[17px] leading-snug">{g.h1}</strong>
                    <span className="line-clamp-3 text-[14px] leading-relaxed text-muted">{g.summary}</span>
                    <span className="mt-auto flex items-center gap-1 pt-1 text-xs font-bold">{readMinutes(g)} min read <ArrowRight aria-hidden size={13} className="transition-transform group-hover:translate-x-0.5" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
