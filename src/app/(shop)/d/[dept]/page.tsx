import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data/catalog";
import { departmentBySlug, departmentCircles, departmentProducts, DEPARTMENTS_LIST } from "@/lib/catalog/departments";
import { DepartmentView } from "./department-view";

export function generateStaticParams() {
  return DEPARTMENTS_LIST.map((d) => ({ dept: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/d/[dept]">): Promise<Metadata> {
  const d = departmentBySlug((await params).dept);
  if (!d) return {};
  return { title: `${d.title} · shop from China`, description: d.intro, alternates: { canonical: `/d/${d.slug}` } };
}

export default async function DepartmentPage({ params }: PageProps<"/d/[dept]">) {
  const d = departmentBySlug((await params).dept);
  if (!d) notFound();
  const products = departmentProducts(d, await getProducts());
  const circles = departmentCircles(d, products).map(({ slug, label, icon, image, count }) => ({ slug, label, icon, image, count }));
  return <DepartmentView dept={{ slug: d.slug, title: d.title, intro: d.intro }} circles={circles} products={products} />;
}
