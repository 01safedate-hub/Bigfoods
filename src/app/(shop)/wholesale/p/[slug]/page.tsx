import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/data/catalog";
import { naira } from "@/lib/format";
import { MIN_QTY } from "@/lib/wholesale/rules";
import { WholesaleProductView } from "./wholesale-product-view";

const listed = (p: { wholesale: boolean; wholesaleFrom: number }) => p.wholesale && p.wholesaleFrom > 0 && Number.isFinite(p.wholesaleFrom);

/** Prerender wholesale products; new ones render on first visit. Cache Components needs at least one entry. */
export async function generateStaticParams() {
  const slugs = (await getProducts()).filter(listed).map((p) => p.slug);
  return (slugs.length ? slugs : ["coming-soon"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/wholesale/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !listed(product)) return { robots: { index: false } };
  const description = `${product.name} wholesale from ${naira(product.wholesaleFrom)} per unit. Minimum ${MIN_QTY} units, shipped by sea from China and delivered to your state.`;
  return {
    title: `${product.name} wholesale`,
    description,
    alternates: { canonical: `/wholesale/p/${slug}` },
    openGraph: { title: `${product.name} · wholesale`, description, url: `/wholesale/p/${slug}`, images: product.images.slice(0, 1) },
  };
}

/** A product as a wholesale buy: wholesale prices only, at least MIN_QTY units, sea only, wholesale cart. */
export default async function WholesaleProductPage({ params }: PageProps<"/wholesale/p/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !listed(product)) notFound();
  return <WholesaleProductView product={product} />;
}
