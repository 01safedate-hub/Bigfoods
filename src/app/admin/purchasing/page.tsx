import type { Metadata } from "next";
import { PurchasingView } from "./purchasing-view";

export const metadata: Metadata = { title: "Purchasing & dispatch" };

export default function PurchasingPage() {
  return <PurchasingView />;
}
