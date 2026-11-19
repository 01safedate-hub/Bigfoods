import { storePublicUrl } from "@/lib/dropship/plans";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore, getStoreProducts } from "@/lib/data/stores";
import { StoreProductView } from "./store-product-view";

export function generateStaticParams() {
  return [{ store: "adas-closet", slug: "satin-cowl-neck-midi-dress" }];
}

async function load(params: PageProps<"/s/[store]/p/[slug]">["params"]) {
  const { store: k, slug } = await params;
  const key = decodeURIComponent(k);
  const found = await getStore(key);
  if (!found) return null;
  const listing = found.listings.find((l) => l.slug === slug);
  if (!listing) return null;
  const [product] = await getStoreProducts([listing]);
  return product ? { key, store: found.store, product } : null;
}

export async function generateMetadata({ params }: PageProps<"/s/[store]/p/[slug]">): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const { slug } = await params;
  return {
    title: d.product.name,
    description: d.product.description,
    alternates: { canonical: `${storePublicUrl(d.store)}/p/${slug}` },
    openGraph: { title: d.product.name, url: `${storePublicUrl(d.store)}/p/${slug}`, images: d.product.images.slice(0, 1) },
  };
}

export default async function StoreProductPage({ params }: PageProps<"/s/[store]/p/[slug]">) {
  const d = await load(params);
  if (!d) notFound();
  return <StoreProductView product={d.product} base={`/s/${d.key}`} theme={d.store.theme} open={d.store.status === "active"} />;
}
