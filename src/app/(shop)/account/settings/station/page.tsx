import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMe } from "@/lib/data/me";
import { Panel, SettingsShell } from "../ui";
import { StationSettings } from "./station-settings";

export const metadata: Metadata = { title: "Pickup station", robots: { index: false } };

export default function StationPage() {
  return (
    <SettingsShell title="Pickup station">
      <Panel>
        <p className="text-[14px] text-muted">This is your primary delivery location. Orders go here unless you pick another station at checkout. We deliver to Jumia pickup stations only, free.</p>
        <Suspense fallback={<div className="h-40" />}>
          <Current />
        </Suspense>
      </Panel>
    </SettingsShell>
  );
}

async function Current() {
  await connection();
  const me = await getMe();
  return <StationSettings signedIn={Boolean(me)} current={me?.station ?? null} />;
}
