import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/shop/product-card";
import { getStore, getStoreProducts } from "@/lib/data/stores";
import { headlineClass, themeTokens } from "@/lib/dropship/theme-tokens";
import { cn, naira } from "@/lib/format";

export default async function StoreHome({ params }: PageProps<"/s/[store]">) {
  const key = decodeURIComponent((await params).store);
  const found = await getStore(key);
  if (!found) notFound();
  const { store } = found;
  const products = await getStoreProducts(found.listings);
  const t = themeTokens(store.theme);
  const base = `/s/${key}`;
  const h = headlineClass(store.theme);
  const tagline = store.tagline ?? "New pieces every week, delivered free to your pickup station.";

  return (
    <>
      {t.hero === "split" && (
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 md:grid-cols-2 md:px-6 md:py-16">
          <div>
            <h1 className={cn("text-[40px] leading-[1.02] md:text-[64px]", h)}>{tagline}</h1>
            <a href="#shop" className="mt-6 inline-flex min-h-12 items-center rounded-[var(--st-radius)] px-6 text-[15px] font-bold text-white" style={{ background: "var(--st-accent)" }}>Shop now</a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p) => <ProductTile key={p.slug} tint={p.tint} icon={p.icon} name={p.name} image={p.images[0]} className="aspect-[3/4] w-full rounded-[var(--st-radius)]" iconSize={56} sizes="(min-width: 768px) 280px, 45vw" />)}
          </div>
        </section>
      )}
      {t.hero === "centered" && (
        <section className="px-4 py-16 text-center md:py-24">
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--st-muted)]">{store.name}</p>
          <h1 className={cn("mx-auto mt-4 max-w-3xl text-[38px] leading-[1.05] md:text-[60px]", h)}>{tagline}</h1>
          <span className="mx-auto mt-6 block h-px w-16" style={{ background: "var(--st-accent)" }} />
        </section>
      )}
      {t.hero === "editorial" && (
        <section className="mx-auto max-w-6xl border-b border-[var(--st-line)] px-4 pb-10 pt-12 md:px-6">
          <p className="text-[12px] uppercase tracking-[0.25em] text-[var(--st-muted)]">The edit · New this week</p>
          <h1 className={cn("mt-3 text-[54px] leading-[0.95] md:text-[110px]", h)}>{store.name}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-[var(--st-muted)]">{tagline}</p>
        </section>
      )}
      {t.hero === "poster" && (
        <section className="relative overflow-hidden px-4 py-16 md:py-24" style={{ background: "linear-gradient(120deg, var(--st-accent), #000 85%)" }}>
          <h1 className="mx-auto max-w-6xl text-[52px] font-black uppercase leading-[0.9] tracking-tight text-white md:text-[110px]">{store.name}</h1>
          <p className="mx-auto mt-4 max-w-6xl text-[17px] font-semibold text-white/80">{tagline}</p>
        </section>
      )}

      <section id="shop" className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <h2 className={cn("mb-5 text-[24px]", h)}>Shop all <span className="text-[14px] font-normal not-italic tracking-normal text-[var(--st-muted)]">{products.length}</span></h2>
        {products.length === 0 && <p className="py-16 text-center text-[var(--st-muted)]">New arrivals are on the way. Check back soon.</p>}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.slug}>
              <Link href={`${base}/p/${p.slug}`} className="group flex flex-col gap-2">
                <ProductTile tint={p.tint} icon={p.icon} name={p.name} image={p.images[0]} className="aspect-[3/4] w-full rounded-[var(--st-radius)] transition-transform duration-300 group-hover:scale-[1.015]" iconSize={60} sizes="(min-width: 1024px) 270px, 45vw" />
                <span className="line-clamp-2 text-[14px] leading-snug">{p.name}</span>
                <strong className="text-[16px]">{naira(p.prices.list)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
