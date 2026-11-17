import type { Metadata } from "next";
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
  return <ContributeView code={code.toUpperCase()} />;
}
