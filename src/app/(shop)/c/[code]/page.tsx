import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProducts } from "@/lib/data/catalog";
import { hasSupabase } from "@/lib/supabase/env";
import { linkProgress } from "../../actions";
import { ContributeView } from "./contribute-view";
import { LiveLink } from "./live-link";

export const metadata: Metadata = {
  title: "Help pay for an order",
  description: "Chip in to a FastChina order with card, transfer or USSD.",
  robots: { index: false },
};

const DEMO_CODE = "TOLU-7K2X";

export function generateStaticParams() {
  return [{ code: DEMO_CODE }];
}

async function Live({ code }: { code: string }) {
  const p = await linkProgress(code);
  if (!p) notFound();
  return <LiveLink code={code} initial={p} />;
}

export default async function ContributePage({ params }: PageProps<"/c/[code]">) {
  const code = (await params).code.toUpperCase();
  if (hasSupabase && code !== DEMO_CODE) {
    return (
      <Suspense fallback={<div className="h-80" />}>
        <Live code={code} />
      </Suspense>
    );
  }
  // The demo link shows how a contribution page works with sample products.
  const all = await getProducts();
  const items = ["satin-cowl-neck-midi-dress", "body-wave-lace-front-wig-22", "amoled-android-phone-5g"].flatMap((s) => all.filter((p) => p.slug === s));
  return <ContributeView code={code} items={items.length ? items : all.slice(0, 3)} />;
}
