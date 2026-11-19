import type { Metadata } from "next";
import { BrandWordmark } from "@/components/shop/brand";
import { Suspense } from "react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { AdminNav } from "./admin-nav";
import { checkStaff } from "@/lib/supabase/auth";
import { secretDb } from "@/lib/supabase/server";
import { StaffGate } from "./staff-gate";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · FastChina admin" },
  robots: { index: false, follow: false },
  manifest: "/pwa/admin",
  appleWebApp: { capable: true, title: "FC Admin", statusBarStyle: "black" },
  icons: { icon: "/pwa/admin-192.png", apple: "/pwa/admin-192.png" },
};

/** Staff see the tabs for their role (null = demo mode: all tabs). */
async function RoleNav() {
  const s = await checkStaff();
  let role: string | null = null;
  if (s.ok && !s.demo && s.user) {
    const { data } = await secretDb().from("profiles").select("role").eq("id", s.user.id).maybeSingle();
    role = data?.role ?? "customer";
  }
  return <AdminNav role={s.ok ? role : "none"} />;
}

/** Admin shell. Every page goes through StaffGate (Supabase Auth + staff role); the database enforces the same with RLS. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F5F7] text-[13px] lg:flex-row">
      <aside className="flex flex-col gap-4 bg-[#0F1115] p-3.5 text-[#D7DAE0] lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:py-5">
        <div className="flex items-baseline gap-0.5 text-white">
          <BrandWordmark className="h-5 w-auto text-white" />
          <span className="text-[11px] font-bold text-gold">admin</span>
        </div>
        <Suspense fallback={<AdminNav role={null} />}>
          <RoleNav />
        </Suspense>
      </aside>
      <OfflineBanner />
      <main id="main" className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <Suspense fallback={<p className="text-[#5B6170]">Checking access…</p>}>
          <StaffGate>{children}</StaffGate>
        </Suspense>
      </main>
    </div>
  );
}
