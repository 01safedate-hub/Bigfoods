import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { getProduct, getProducts, getProductSlugs, getQuestions } from "@/lib/data/catalog";
import { ProductView } from "./product-view";

/** Prerender known products; new ones render on first visit. Cache Components needs at least one entry. */
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return (slugs.length ? slugs : ["coming-soon"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product
    ? {
        title: product.name,
        description: product.description,
        alternates: { canonical: `/product/${slug}` },
        openGraph: { title: product.name, description: product.description, images: product.images.slice(0, 1), type: "website" },
      }
    : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const qa = await getQuestions(slug);
  const related = (await getProducts()).filter((p) => p.slug !== slug && (p.category === product.category || p.flash)).slice(0, 6);

  // Product details for search engines (Google Shopping-style results).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    aggregateRating: product.reviews ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews } : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "NGN",
      lowPrice: Math.min(...product.variants.map((v) => v.prices.list)),
      highPrice: Math.max(...product.variants.map((v) => v.prices.list)),
      availability: "https://schema.org/InStock",
      shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "NGN" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "NG" } },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductView product={qa ? { ...product, qa } : product} />
      <section aria-label="You may also like" className="flex flex-col gap-2.5 px-1.5 pt-4 md:px-0">
        <h2 className="px-1.5 text-[15px] font-extrabold md:px-0 md:text-lg">You may also like</h2>
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 lg:grid-cols-6">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
