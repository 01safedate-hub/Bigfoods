import type { Metadata } from "next";
import { connection } from "next/server";
import { getSeller } from "@/lib/data/seller";
import { getStore } from "@/lib/data/stores";
import { DemoNote, Gate } from "../_ui/gate";
import { Page } from "../_ui/ui";
import { DesignEditor } from "./design-editor";

export const metadata: Metadata = { title: "Design" };

export default async function DesignPage() {
  await connection();
  const state = await getSeller();
  if (state.kind !== "live" && state.kind !== "demo") return <Gate state={state} />;
  const pub = await getStore(state.data.store.slug);
  return (
    <Page title="Design your store" subtitle="Changes go live within a minute.">
      <DemoNote demo={state.kind === "demo"} />
      <DesignEditor store={state.data.store} allowSmall={pub?.store.allowSmallSmall ?? true} />
    </Page>
  );
}
