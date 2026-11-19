import type { Metadata } from "next";
import { Suspense } from "react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SellerNav } from "./_ui/nav";

export const metadata: Metadata = { title: { default: "Seller dashboard", template: "%s · Seller · FastChina" }, robots: { index: false, follow: false }, alternates: { canonical: null },
  manifest: "/pwa/seller", appleWebApp: { capable: true, title: "Seller", statusBarStyle: "black" }, icons: { icon: "/pwa/seller-192.png", apple: "/pwa/seller-192.png" } };

/** Seller dashboard shell: dark, focused, quick. Sidebar on desktop, tab bar on phones. */
export default function SellerLayout({ children }: LayoutProps<"/store/seller">) {
  return (
    <div className="flex min-h-dvh bg-[#0E0E10] text-[#F2F2F2] [color-scheme:dark]">
      <SellerNav />
      <main id="main" className="min-w-0 flex-1 pb-24 md:pb-10">
        <Suspense fallback={<div className="p-6 text-[#A1A1AA]">Loading…</div>}>{children}</Suspense>
      </main>
      <OfflineBanner />
    </div>
  );
}
