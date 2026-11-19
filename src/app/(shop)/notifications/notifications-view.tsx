"use client";

import { Bell, CreditCard, Gift, MessageCircle, Package, Sparkles, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/format";
import { getPrefs, type InAppNotice, markNotificationsRead, myNotifications, type Prefs, savePrefs } from "../actions";
import { call } from "@/lib/net";

const ICON: Record<string, typeof Bell> = { order: Package, payment: CreditCard, group: Users, qa: MessageCircle, wallet: Wallet, promo: Sparkles, welcome: Gift };

const ago = (iso: string, now: number) => {
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
};

export function NotificationsView() {
  const [data, setData] = useState<{ items: InAppNotice[]; unread: number } | null | undefined>(undefined);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [, start] = useTransition();

  useEffect(() => {
    let live = true;
    Promise.all([myNotifications(), getPrefs()]).then(([n, p]) => {
      if (!live) return;
      setNow(Date.now());
      setData(n);
      setPrefs(p);
      if (n?.unread) void markNotificationsRead();     // seen on this page = read
    }).catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, []);

  const toggle = (k: keyof Prefs) => {
    if (!prefs) return;
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    start(async () => setMsg((await call(() => savePrefs(next))).message));
  };

  if (data === undefined) return <div className="h-80" />;
  if (data === null) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-16 text-center">
        <Bell aria-hidden size={32} />
        <h1 className="text-xl font-extrabold">Notifications</h1>
        <p className="text-muted">Sign in to get updates on your orders, payments and Group pay links here and by email.</p>
        <Link href="/sign-in?next=/notifications" className="min-h-11 rounded-md bg-ink px-5 py-3 text-sm font-extrabold text-white">SIGN IN</Link>
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 px-3 py-6 md:px-0">
      <h1 className="text-2xl font-extrabold">Notifications</h1>
      <section className="flex flex-col rounded-lg border border-line bg-white">
        {data.items.length === 0 && <p className="p-6 text-center text-muted">Nothing yet. Updates about your orders will appear here.</p>}
        {data.items.map((n) => {
          const Icon = ICON[n.kind] ?? Bell;
          const body = (
            <span className="flex gap-3 p-3.5">
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", n.kind === "promo" ? "bg-[#FFF3D6]" : "bg-surface")}><Icon aria-hidden size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <strong className="text-[14px]">{n.title}</strong>
                  <span className="shrink-0 text-xs text-muted">{ago(n.created_at, now)}</span>
                </span>
                <span className="block text-[13px] text-muted">{n.body}</span>
              </span>
              {!n.read_at && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-sale" />}
            </span>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} className="border-t border-line first:border-0 hover:bg-surface">{body}</Link>
          ) : (
            <div key={n.id} className="border-t border-line first:border-0">{body}</div>
          );
        })}
      </section>

      {prefs && (
        <section className="flex flex-col gap-1 rounded-lg border border-line bg-white p-3.5">
          <h2 className="pb-1 font-extrabold">Settings</h2>
          {([
            ["order_email", "Order and payment emails", "Confirmations, reminders before a payment is due, shipping and refunds. Recommended."],
            ["marketing_email", "Offer emails", "Midnight Drop alerts and big events. A few a week at most."],
            ["in_app_marketing", "Offers here in the app", "Midnight Drop and event alerts on this page."],
          ] as [keyof Prefs, string, string][]).map(([k, label, help]) => (
            <button key={k} type="button" role="switch" aria-checked={prefs[k]} onClick={() => toggle(k)} className="flex min-h-14 items-center justify-between gap-3 text-left">
              <span>
                <strong className="block text-[14px]">{label}</strong>
                <span className="text-xs text-muted">{help}</span>
              </span>
              <span className={cn("flex h-[26px] w-11 shrink-0 rounded-full p-[3px]", prefs[k] ? "justify-end bg-ink" : "justify-start bg-[#d4d4d4]")}>
                <span className="size-5 rounded-full bg-white" />
              </span>
            </button>
          ))}
          {msg && <p role="status" className="text-xs text-muted">{msg}</p>}
        </section>
      )}
    </div>
  );
}
