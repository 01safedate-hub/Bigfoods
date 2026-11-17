import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/data/catalog";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage() {
  const products = await getProducts();
  return (
    <Suspense fallback={<div className="h-40" />}>
      <SearchView products={products} />
    </Suspense>
  );
}
