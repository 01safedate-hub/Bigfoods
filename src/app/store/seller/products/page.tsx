import type { Metadata } from "next";
import { connection } from "next/server";
import { getProducts } from "@/lib/data/catalog";
import { getSeller } from "@/lib/data/seller";
import { PLANS } from "@/lib/dropship/plans";
import { myListings, type MyListing } from "../actions";
import { DemoNote, Gate } from "../_ui/gate";
import { Page } from "../_ui/ui";
import { ProductsManager } from "./products-manager";

export const metadata: Metadata = { title: "Products" };

const DEMO_LISTINGS: MyListing[] = ["satin-cowl-neck-midi-dress", "quilted-crossbody-chain-bag", "body-wave-lace-front-wig-22", "matte-liquid-lipstick-set", "mens-steel-quartz-watch"]
  .map((slug, i) => ({ slug, markupType: i === 2 ? "fixed" : "pct", markupValue: i === 2 ? 15_000 : 25, active: true }));

export default async function ProductsPage() {
  await connection();
  const state = await getSeller();
  if (state.kind !== "live" && state.kind !== "demo") return <Gate state={state} />;
  const [catalog, listings] = await Promise.all([getProducts(), state.kind === "demo" ? Promise.resolve(DEMO_LISTINGS) : myListings()]);
  const plan = PLANS[state.data.store.plan];
  return (
    <Page title="Products" subtitle={`Pick from FastChina’s catalogue and set your price. ${plan.name} plan: up to ${plan.maxProducts >= 100_000 ? "unlimited" : plan.maxProducts} products.`}>
      <DemoNote demo={state.kind === "demo"} />
      <ProductsManager catalog={catalog} listings={listings ?? []} plan={state.data.store.plan} />
    </Page>
  );
}
