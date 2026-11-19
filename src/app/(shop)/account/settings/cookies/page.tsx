import type { Metadata } from "next";
import Link from "next/link";
import { Panel, SettingsShell } from "../ui";

export const metadata: Metadata = { title: "Manage cookies", robots: { index: false } };

const USED = [
  ["Sign-in (essential)", "Keeps you signed in. Set by our login provider (Supabase) only when you sign in."],
  ["Cart, wishlist, pickup station (on your device)", "Stored in your browser’s local storage so the site works fast and offline. Never sent to advertisers."],
  ["Offline copies", "Pages and product photos the app saved so it works on weak data. Clear them in Settings → Clear cache."],
] as const;

export default function CookiesPage() {
  return (
    <SettingsShell title="Manage cookies">
      <Panel>
        <p className="text-[14px] text-muted">We don’t use advertising or tracking cookies, so there’s nothing to switch off. This is everything the site stores:</p>
        <ul className="flex flex-col gap-3">
          {USED.map(([t, d]) => (
            <li key={t} className="flex flex-col gap-0.5 rounded-xl bg-surface p-3"><strong className="text-[14px]">{t}</strong><span className="text-[13px] leading-relaxed text-muted">{d}</span></li>
          ))}
        </ul>
        <Link href="/legal/privacy" className="text-[13px] font-bold underline">Read the privacy policy</Link>
      </Panel>
    </SettingsShell>
  );
}
