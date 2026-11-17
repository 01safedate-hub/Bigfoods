import { CartProvider } from "@/components/shop/cart-provider";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { TabBar } from "@/components/shop/tab-bar";
import { ThemeSync } from "@/components/shop/theme-sync";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <ThemeSync />
      <ShopHeader />
      <main className="mx-auto w-full max-w-[1360px] text-[13px] md:px-6">{children}</main>
      <ShopFooter />
      <TabBar />
    </CartProvider>
  );
}
