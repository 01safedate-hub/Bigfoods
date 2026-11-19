import type { Metadata } from "next";
import { WholesaleCart } from "./wholesale-cart";

export const metadata: Metadata = { title: "Wholesale cart", robots: { index: false } };

export default function WholesaleCartPage() {
  return <WholesaleCart />;
}
