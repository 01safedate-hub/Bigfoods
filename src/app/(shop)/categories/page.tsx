import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryBrowser } from "./category-browser";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <CategoryBrowser />
    </Suspense>
  );
}
