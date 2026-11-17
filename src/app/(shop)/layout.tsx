import { CartProvider } from "@/components/shop/cart-provider";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SiteDataProvider } from "@/components/shop/site-data";
import { TabBar } from "@/components/shop/tab-bar";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { WishlistProvider } from "@/components/shop/wishlist-provider";
import { ThemeSync } from "@/components/shop/theme-sync";
import { getSiteData } from "@/lib/data/site";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const site = await getSiteData();
  return (
    <SiteDataProvider value={site}>
      <CartProvider>
        <WishlistProvider>
        <a href="#main" className="sr-only z-[80] bg-ink px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2">Skip to content</a>
        <ThemeSync />
        <ShopHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1360px] text-[13px] outline-none md:px-6">{children}</main>
        <ShopFooter />
        <TabBar />
        <OfflineBanner />
        <div aria-hidden className="bolt-sweep" />
        </WishlistProvider>
      </CartProvider>
    </SiteDataProvider>
  );
}
