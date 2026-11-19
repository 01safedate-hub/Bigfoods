import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { CATEGORY_KEYS, CATEGORY_PAGES } from "@/lib/content/category-pages";
import { guideBySlug } from "@/lib/content/guides";
import { getProducts } from "@/lib/data/catalog";
import { naira } from "@/lib/format";
import type { CategoryKey } from "@/lib/pricing/engine";
import { breadcrumbs, faq, graph, SHOP_URL, snippet } from "@/lib/seo";

const isKey = (s: string): s is CategoryKey => (CATEGORY_KEYS as string[]).includes(s);

export function generateStaticParams() {
  return CATEGORY_KEYS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isKey(slug)) return {};
  const c = CATEGORY_PAGES[slug];
  return {
    title: { absolute: `${c.title} · FastChina` },
    description: snippet(c.description),
    alternates: { canonical: `/category/${slug}` },
    openGraph: { type: "website", url: `/category/${slug}`, title: c.title, description: c.description },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  if (!isKey(slug)) notFound();
  const c = CATEGORY_PAGES[slug];
  const products = (await getProducts()).filter((p) => p.category === slug);
  const from = products.length ? Math.min(...products.map((p) => p.prices.list)) : 0;
  const guides = c.guides.map(guideBySlug).filter((g) => g !== undefined);

  return (
    <div className="flex flex-col gap-6 px-3 py-5 md:px-0 md:py-8">
      <JsonLd
        data={graph(
          breadcrumbs([["Home", "/"], [c.name, `/category/${slug}`]]),
          {
            "@type": "CollectionPage",
            "@id": `${SHOP_URL}/category/${slug}`,
            name: c.title,
            description: c.description,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: products.length,
              itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SHOP_URL}/product/${p.slug}`, name: p.name })),
            },
          },
          faq(c.faqs),
        )}
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-muted">
        <Link href="/">Home</Link><ChevronRight aria-hidden size={13} /><span aria-current="page">{c.name}</span>
      </nav>

      <header className="flex max-w-3xl flex-col gap-2.5">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight md:text-[36px]">{c.h1}</h1>
        <p className="text-[14px] leading-relaxed text-muted md:text-[15px]">{c.intro}</p>
        {from > 0 && <p className="text-[13px] font-semibold">{products.length} products · from {naira(from)} · free shipping</p>}
      </header>

      {products.length ? (
        <ul className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 lg:grid-cols-6">
          {products.map((p) => <li key={p.slug} className="min-w-0"><ProductCard product={p} /></li>)}
        </ul>
      ) : (
        <p className="rounded-md bg-surface p-6 text-center text-[14px]">New {c.name.toLowerCase()} are being added. <Link href="/search" className="font-bold underline">Search the catalogue</Link>.</p>
      )}

      <div className="grid gap-6 border-t border-line pt-6 md:grid-cols-2">
        <section aria-labelledby="cat-faq" className="flex flex-col gap-2">
          <h2 id="cat-faq" className="text-[16px] font-extrabold">{c.name}: questions people ask</h2>
          {c.faqs.map((f) => (
            <details key={f.q} className="rounded-lg border border-line px-3.5 py-2.5 text-[14px] open:bg-surface">
              <summary className="cursor-pointer font-bold">{f.q}</summary>
              <p className="pt-1.5 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </section>
        <section aria-labelledby="cat-more" className="flex flex-col gap-2">
          <h2 id="cat-more" className="text-[16px] font-extrabold">Helpful guides</h2>
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-3 text-[14px] font-semibold hover:border-ink">
              {g.h1} <ArrowRight aria-hidden size={15} className="shrink-0" />
            </Link>
          ))}
          <Link href="/wholesale" className="flex items-center justify-between gap-3 rounded-lg bg-gold-soft px-3.5 py-3 text-[14px] font-semibold text-gold-ink">
            Buying 10 or more? See wholesale prices <ArrowRight aria-hidden size={15} className="shrink-0" />
          </Link>
          <nav aria-label="Other categories" className="flex flex-wrap gap-1.5 pt-2">
            {CATEGORY_KEYS.filter((k) => k !== slug).map((k) => (
              <Link key={k} href={`/category/${k}`} className="rounded-full border border-line px-3 py-1.5 text-[12px]">{CATEGORY_PAGES[k].name}</Link>
            ))}
          </nav>
        </section>
      </div>
    </div>
  );
}
