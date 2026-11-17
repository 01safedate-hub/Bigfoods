import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/data/catalog";
import { CategoryBrowser } from "./category-browser";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const products = await getProducts();
  return (
    <Suspense fallback={<div className="h-40" />}>
      <CategoryBrowser products={products} />
    </Suspense>
  );
}
