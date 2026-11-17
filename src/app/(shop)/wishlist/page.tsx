import type { Metadata } from "next";
import { getProducts } from "@/lib/data/catalog";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = { title: "Saved items", robots: { index: false } };

export default async function WishlistPage() {
  return <WishlistView products={await getProducts()} />;
}
