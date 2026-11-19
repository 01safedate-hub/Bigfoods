import type { Metadata } from "next";
import { WholesaleCheckout } from "./wholesale-checkout";

export const metadata: Metadata = { title: "Wholesale checkout", robots: { index: false } };

export default function WholesaleCheckoutPage() {
  return <WholesaleCheckout />;
}
