import type { Metadata } from "next";
import { DealsView } from "./deals-view";

export const metadata: Metadata = { title: "Deals & Rewards" };

export default function DealsPage() {
  return <DealsView />;
}
