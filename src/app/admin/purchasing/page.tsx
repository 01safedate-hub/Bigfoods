import type { Metadata } from "next";
import { getLivePurchasing } from "@/lib/data/admin";
import { checkStaff } from "@/lib/supabase/auth";
import { PurchasingView } from "./purchasing-view";

export const metadata: Metadata = { title: "Purchasing & dispatch" };

export default async function PurchasingPage() {
  const s = await checkStaff();
  return <PurchasingView live={s.ok && !s.demo ? await getLivePurchasing() : null} />;
}
