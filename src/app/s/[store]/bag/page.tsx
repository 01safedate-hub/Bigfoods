import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteData } from "@/lib/data/site";
import { getStore } from "@/lib/data/stores";
import { BagView } from "./bag-view";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default async function BagPage({ params }: PageProps<"/s/[store]/bag">) {
  const key = decodeURIComponent((await params).store);
  const [found, site] = await Promise.all([getStore(key), getSiteData()]);
  if (!found) notFound();
  return <BagView store={found.store.slug} storeKey={key} open={found.store.status === "active"} stations={site.stations} />;
}
