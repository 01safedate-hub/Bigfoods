import type { Metadata } from "next";
import { getProducts } from "@/lib/data/catalog";
import { AccountView } from "./account-view";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  // Until accounts are live: a few items standing in for the customer's viewing history.
  const cheaper = (await getProducts()).filter((p) => !p.isGadget && p.shipMode === "air").slice(0, 4);
  return <AccountView cheaper={cheaper} />;
}
