import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { EndlessFeed } from "@/components/shop/endless-feed";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { CATEGORY_PAGES } from "@/lib/content/category-pages";
import { getProduct, getProducts, getProductSlugs, getQuestions, getReviews } from "@/lib/data/catalog";
import { naira } from "@/lib/format";
import { breadcrumbs, graph, returnPolicy, SHOP_URL, shippingDetails, snippet } from "@/lib/seo";
import { ProductView } from "./product-view";

/** Prerender known products; new ones render on first visit. Cache Components needs at least one entry. */
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return (slugs.length ? slugs : ["coming-soon"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { robots: { index: false } };
  const from = product.prices.list;
  const title = `${product.name} — ${naira(from)}, free delivery in Nigeria`;
  const description = snippet(`${product.name} from China at ${naira(from)} with free shipping to your Jumia pickup station. ${product.description}`);
  return {
    title: { absolute: title.length > 70 ? `${product.name} · FastChina` : title },
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: { title: product.name, description, url: `/product/${slug}`, images: product.images.slice(0, 4).map((url) => ({ url, alt: product.name })), type: "website" },
    twitter: { card: product.images.length ? "summary_large_image" : "summary", title: product.name, description },
    other: { "product:price:amount": String(from), "product:price:currency": "NGN" },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [qa, reviews] = await Promise.all([getQuestions(slug), getReviews(slug)]);
  // Related first, then everything else by popularity: the page keeps showing products as you scroll.
  const all = (await getProducts()).filter((p) => p.slug !== slug);
  const near = all.filter((p) => p.category === product.category);
  const related = [...near, ...all.filter((p) => p.category !== product.category).sort((a, b) => b.sold - a.sold)].slice(0, 120);

  // Product details for search engines (Google merchant listings and product snippets).
  const url = `${SHOP_URL}/product/${slug}`;
  const inStock = product.variants.some((v) => v.stock > 0);
  const lows = product.variants.map((v) => v.prices.list);
  const cat = CATEGORY_PAGES[product.category];
  const jsonLd = graph(
    {
      "@type": "Product",
      "@id": `${url}#product`,
      name: product.name,
      description: product.description,
      image: product.images,
      sku: product.slug,
      url,
      category: cat?.name,
      brand: { "@type": "Brand", name: "FastChina" },
      additionalProperty: product.specs.slice(0, 10).map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
      aggregateRating: product.reviews ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews } : undefined,
      offers: {
        "@type": "AggregateOffer",
        url,
        priceCurrency: "NGN",
        lowPrice: Math.min(...lows),
        highPrice: Math.max(...lows),
        offerCount: product.variants.length,
        itemCondition: "https://schema.org/NewCondition",
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@id": `${SHOP_URL}/#org` },
        shippingDetails: shippingDetails(),
        hasMerchantReturnPolicy: returnPolicy(),
      },
    },
    breadcrumbs([["Home", "/"], ...(cat ? [[cat.name, `/category/${product.category}`] as [string, string]] : []), [product.name, `/product/${slug}`]]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductView product={qa ? { ...product, qa } : product} />
      <div className="px-0 pt-2 md:pt-4">
        <ReviewsSection reviews={reviews} rating={product.rating} count={product.reviews} />
      </div>
      <EndlessFeed products={related} />
    </>
  );
}
