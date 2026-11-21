import type { Metadata } from "next";
import { getProducts } from "@/lib/data/catalog";
import { DealsView } from "./deals-view";

export const metadata: Metadata = { title: "Deals & Rewards" };

export default async function DealsPage() {
  const products = await getProducts();
  return <DealsView flash={products} />;
}
