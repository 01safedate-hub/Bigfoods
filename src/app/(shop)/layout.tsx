import { CartProvider } from "@/components/shop/cart-provider";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SiteDataProvider } from "@/components/shop/site-data";
import { TabBar } from "@/components/shop/tab-bar";
import { WishlistProvider } from "@/components/shop/wishlist-provider";
import { ThemeSync } from "@/components/shop/theme-sync";
import { getSiteData } from "@/lib/data/site";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const site = await getSiteData();
  return (
    <SiteDataProvider value={site}>
      <CartProvider>
        <WishlistProvider>
        <ThemeSync />
        <ShopHeader />
        <main className="mx-auto w-full max-w-[1360px] text-[13px] md:px-6">{children}</main>
        <ShopFooter />
        <TabBar />
        <div aria-hidden className="bolt-sweep" />
        </WishlistProvider>
      </CartProvider>
    </SiteDataProvider>
  );
}
