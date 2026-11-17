import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { PRODUCTS, productBySlug } from "@/lib/catalog/products";
import { ProductView } from "./product-view";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  const related = PRODUCTS.filter((p) => p.slug !== slug && (p.category === product.category || p.flash)).slice(0, 6);

  return (
    <>
      <ProductView product={product} />
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
