import type { Metadata } from "next";
import { getProducts } from "@/lib/data/catalog";
import { ContributeView } from "./contribute-view";

export const metadata: Metadata = {
  title: "Help pay for an order",
  description: "Chip in to a FastChina order with card, transfer or USSD.",
  robots: { index: false },
};

export function generateStaticParams() {
  return [{ code: "TOLU-7K2X" }];
}

export default async function ContributePage({ params }: PageProps<"/c/[code]">) {
  const { code } = await params;
  // Demo order until group-pay links are stored in Supabase.
  const all = await getProducts();
  const items = ["satin-cowl-neck-midi-dress", "body-wave-lace-front-wig-22", "amoled-android-phone-5g"].flatMap((s) => all.filter((p) => p.slug === s));
  return <ContributeView code={code.toUpperCase()} items={items.length ? items : all.slice(0, 3)} />;
}
