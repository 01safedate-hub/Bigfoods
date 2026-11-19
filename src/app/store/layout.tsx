import type { Metadata } from "next";
import { STORE_DESCRIPTION, STORE_URL } from "@/lib/seo";

/** fastchina.store is its own site: paths here are served at the root of that domain (see proxy.ts). */
export const metadata: Metadata = {
  metadataBase: new URL(STORE_URL),
  title: { default: "Start Dropshipping in Nigeria for Free · FastChina.store", template: "%s · FastChina.store" },
  description: STORE_DESCRIPTION,
  keywords: ["dropshipping in Nigeria", "how to start dropshipping for free", "free online store Nigeria", "dropshipping from China", "wholesale sea freight China to Nigeria"],
  alternates: { canonical: "/" },
  manifest: "/pwa/store",
  appleWebApp: { capable: true, title: "FastChina.store", statusBarStyle: "black-translucent" },
  icons: { icon: "/pwa/store-192.png", apple: "/pwa/store-192.png" },
  openGraph: { type: "website", siteName: "FastChina.store", locale: "en_NG", url: "/", title: "Start your dropshipping store in Nigeria for free", description: STORE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Start your dropshipping store in Nigeria for free", description: STORE_DESCRIPTION },
};

export default function StoreLayout({ children }: LayoutProps<"/store">) {
  return <div className="bg-[#FBFAF6] text-ink">{children}</div>;
}
