import type { Metadata } from "next";
import { ProductForm } from "./product-form";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return <ProductForm />;
}
