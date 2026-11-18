import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { getStore } from "@/lib/data/stores";
import { headlineClass, themeStyle } from "@/lib/dropship/theme-tokens";
import { cn } from "@/lib/format";
import { BagCount } from "../bag-count";
import { BagProvider } from "../bag-provider";
import { VisitPing } from "../visit-ping";

export function generateStaticParams() {
  return [{ store: "adas-closet" }, { store: "demo-noir" }, { store: "demo-bloom" }, { store: "demo-atelier" }, { store: "demo-pulse" }];
}

export async function generateMetadata({ params }: LayoutProps<"/s/[store]">): Promise<Metadata> {
  const found = await getStore(decodeURIComponent((await params).store));
  if (!found) return { title: "Store not found" };
  const { store } = found;
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: store.tagline ?? `${store.name}: delivered free to your Jumia pickup station.`,
    openGraph: { title: store.name, description: store.tagline ?? undefined },
    icons: { icon: "/icon.svg" },
  };
}

/** A seller's storefront, styled by their theme and accent colour. */
export default async function StoreLayout({ children, params }: LayoutProps<"/s/[store]">) {
  const key = decodeURIComponent((await params).store);
  const found = await getStore(key);
  if (!found) notFound();
  const { store } = found;
  // On the seller's own address the store is at "/"; elsewhere (previews) under /s/<key>.
  const base = `/s/${key}`;
  return (
    <BagProvider store={store.slug}>
      <div style={themeStyle(store.theme, store.accent)} className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-black focus:px-4 focus:py-3 focus:text-white">Skip to content</a>
        <header className="sticky top-0 z-30 border-b border-[var(--st-line)] bg-[var(--st-bg)]/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
            <Link href={base} className={cn("truncate text-[20px]", headlineClass(store.theme))}>{store.name}</Link>
            <Link href={`${base}/bag`} className="relative flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] font-bold text-white" style={{ background: "var(--st-accent)" }}>
              <ShoppingBag aria-hidden size={18} /> Bag <BagCount />
            </Link>
          </div>
        </header>
        {store.status !== "active" && (
          <p role="status" className="bg-[var(--st-card)] px-4 py-2.5 text-center text-[13px]">This store is taking a short break. You can browse; ordering will be back soon.</p>
        )}
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-[var(--st-line)] px-4 py-8 text-center text-[12px] text-[var(--st-muted)]">
          <p>Free delivery to your Jumia pickup station · Pay in full or Pay small small · Refund if it never arrives</p>
          <p className="mt-2">
            <Link href="/track" className="underline">Track an order</Link> · <Link href="/legal/terms" className="underline">Terms</Link> · <Link href="/legal/privacy" className="underline">Privacy</Link> · Powered by <a href="https://fastchina.store" className="font-bold underline">FastChina</a>
          </p>
        </footer>
        <VisitPing storeId={store.id} />
        <OfflineBanner />
      </div>
    </BagProvider>
  );
}
