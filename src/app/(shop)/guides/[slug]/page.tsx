import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Blocks } from "@/components/seo/rich-text";
import { GUIDES, guideBySlug, readMinutes } from "@/lib/content/guides";
import { breadcrumbs, faq, graph, SHOP_URL } from "@/lib/seo";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  return {
    title: { absolute: g.title },
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
      type: "article", url: `/guides/${g.slug}`, title: g.title, description: g.description, publishedTime: g.published, modifiedTime: g.updated, section: g.topic,
      images: [{ url: `/og/guides/${g.slug}`, width: 1200, height: 630, alt: g.h1 }],
    },
    twitter: { card: "summary_large_image", title: g.title, description: g.description, images: [`/og/guides/${g.slug}`] },
  };
}

const anchor = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const url = `${SHOP_URL}/guides/${g.slug}`;
  const related = GUIDES.filter((x) => x.slug !== g.slug).sort((a, b) => Number(b.topic === g.topic) - Number(a.topic === g.topic)).slice(0, 3);

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,760px)] lg:gap-12 xl:grid-cols-[260px_minmax(0,760px)_1fr]">
    {/* Desktop: contents stay in view on the left. */}
    <nav aria-label="Contents" className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] flex-col gap-1 self-start overflow-y-auto pt-10 lg:flex">
      <strong className="px-3 pb-1 text-[12px] tracking-wider text-muted">IN THIS GUIDE</strong>
      {g.sections.map((s) => <a key={s.h} href={`#${anchor(s.h)}`} className="rounded-lg px-3 py-2 text-[14px] leading-snug hover:bg-surface">{s.h}</a>)}
      <a href="#faq" className="rounded-lg px-3 py-2 text-[14px] hover:bg-surface">Questions people ask</a>
      <Link href="/guides" className="mt-3 px-3 text-[13px] font-bold underline">All guides</Link>
    </nav>
    <article className="flex min-w-0 flex-col gap-8 px-4 py-6 text-[16px] leading-[1.7] text-[#333] md:py-10 lg:px-0">
      <JsonLd
        data={graph(
          {
            "@type": "Article",
            "@id": `${url}#article`,
            headline: g.h1,
            description: g.description,
            datePublished: g.published,
            dateModified: g.updated,
            inLanguage: "en-NG",
            mainEntityOfPage: url,
            image: `${SHOP_URL}/og/guides/${g.slug}`,
            keywords: g.keywords.join(", "),
            articleSection: g.topic,
            author: { "@type": "Organization", "@id": `${SHOP_URL}/#org`, name: "FastChina", url: SHOP_URL },
            publisher: { "@id": `${SHOP_URL}/#org` },
          },
          breadcrumbs([["Home", "/"], ["Guides", "/guides"], [g.h1, `/guides/${g.slug}`]]),
          faq(g.faqs),
        )}
      />

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <Link href="/">Home</Link><ChevronRight aria-hidden size={13} />
        <Link href="/guides">Guides</Link><ChevronRight aria-hidden size={13} />
        <span aria-current="page" className="truncate">{g.topic}</span>
      </nav>

      <header className="flex flex-col gap-4">
        <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-tight text-ink md:text-[42px]">{g.h1}</h1>
        <p className="text-[13px] text-muted">
          By the FastChina team · Updated <time dateTime={g.updated}>{fmt(g.updated)}</time> · {readMinutes(g)} min read
        </p>
        <p className="rounded-2xl bg-surface p-5 text-[17px] leading-relaxed text-ink"><strong>In short: </strong>{g.summary}</p>
      </header>

      <nav aria-label="In this guide" className="flex flex-col gap-2 border-y border-line py-4 lg:hidden">
        <strong className="text-[13px] tracking-wide text-ink">IN THIS GUIDE</strong>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-[15px]">
          {g.sections.map((s) => <li key={s.h}><a href={`#${anchor(s.h)}`} className="hover:underline">{s.h}</a></li>)}
          <li><a href="#faq" className="hover:underline">Questions people ask</a></li>
        </ol>
      </nav>

      {g.sections.map((s) => (
        <section key={s.h} aria-labelledby={anchor(s.h)} className="flex scroll-mt-24 flex-col gap-4">
          <h2 id={anchor(s.h)} className="text-[22px] font-extrabold leading-snug text-ink md:text-[26px]">{s.h}</h2>
          <Blocks blocks={s.blocks} />
        </section>
      ))}

      <aside className="flex flex-col gap-3 rounded-3xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <span className="flex flex-col gap-1">
          <strong className="text-xl">{g.cta.title}</strong>
          <span className="text-[15px] text-white/75">{g.cta.text}</span>
        </span>
        {g.cta.href.startsWith("/") ? (
          <Link href={g.cta.href} className="flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-6 text-[15px] font-bold text-ink">{g.cta.label} <ArrowRight aria-hidden size={16} /></Link>
        ) : (
          <a href={g.cta.href} className="flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-6 text-[15px] font-bold text-ink">{g.cta.label} <ArrowRight aria-hidden size={16} /></a>
        )}
      </aside>

      <section id="faq" aria-labelledby="faq-h" className="flex scroll-mt-24 flex-col gap-3">
        <h2 id="faq-h" className="text-[22px] font-extrabold text-ink md:text-[26px]">Questions people ask</h2>
        {g.faqs.map((f) => (
          <details key={f.q} className="group rounded-xl border border-line px-4 py-3 open:bg-surface">
            <summary className="cursor-pointer list-none font-bold text-ink marker:hidden">{f.q}</summary>
            <p className="pt-2">{f.a}</p>
          </details>
        ))}
      </section>

      <section aria-labelledby="more-h" className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 id="more-h" className="text-lg font-extrabold text-ink">Keep reading</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/guides/${r.slug}`} className="flex h-full flex-col gap-1 rounded-xl border border-line p-4 text-[14px] leading-snug hover:border-ink">
                <span className="text-[11px] font-extrabold tracking-wider text-success">{r.topic.toUpperCase()}</span>
                <strong className="text-ink">{r.h1}</strong>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
    </div>
  );
}
