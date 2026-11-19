import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMe } from "@/lib/data/me";
import { signOut } from "../../actions";
import { ClearCacheRow } from "./clear-cache";
import { Group, Row, SettingsShell } from "./ui";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return (
    <SettingsShell title="Settings" back="/account">
      <Suspense fallback={<div className="h-14 bg-white" />}>
        <Account />
      </Suspense>
      <Group>
        <Row href="/account/settings/station" label="Pickup station (address book)" />
        <Row href="/account/settings/payments" label="My payment options" />
        <Row href="/account/settings/profile" label="Manage my account" />
      </Group>
      <Group>
        <Row href="/account/settings/station" label="Location" value="Nigeria" />
        <Row href="/account/settings/payments" label="Currency" value="NGN ₦" />
        <Row href="/notifications" label="Contact preferences" />
        <ClearCacheRow />
      </Group>
      <Group>
        <Row href="/legal/privacy" label="Privacy & cookie policy" />
        <Row href="/legal/terms" label="Terms & conditions" />
        <Row href="/legal/refunds" label="Refunds & returns" />
        <Row href="/account/settings/feedback" label="Rating & feedback" />
        <Row href="/account/settings/contact" label="Connect to us" />
        <Row href="/why-fastchina" label="About FastChina" />
        <Row href="/account/settings/cookies" label="Manage cookies" />
      </Group>
      <Suspense fallback={null}>
        <SignOut />
      </Suspense>
      <p className="py-4 text-center text-[13px] text-subtle">FastChina · Version {process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0"}</p>
    </SettingsShell>
  );
}

async function Account() {
  await connection();
  const me = await getMe();
  return (
    <Group>
      {me ? (
        <Row href="/account/settings/profile" label={<strong className="font-bold">{me.name}</strong>} value={me.email ?? me.phone ?? ""} />
      ) : (
        <Row href="/sign-in?next=/account/settings" label={<strong className="font-bold">Sign in or create an account</strong>} />
      )}
    </Group>
  );
}

async function SignOut() {
  await connection();
  const me = await getMe();
  if (!me) return null;
  return (
    <form action={signOut} className="bg-white md:rounded-2xl md:border md:border-line">
      <button type="submit" className="flex min-h-14 w-full items-center px-4 text-left text-[15px] font-light hover:bg-surface">Sign out</button>
    </form>
  );
}
