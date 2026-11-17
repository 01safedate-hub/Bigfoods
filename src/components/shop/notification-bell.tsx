"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { myNotifications } from "@/app/(shop)/actions";
import { cn } from "@/lib/format";

/** Shows only for signed-in customers. Refreshes when the tab comes back into view, and every 2 minutes. */
export function NotificationBell({ className }: { className?: string }) {
  const [unread, setUnread] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => myNotifications().then((r) => live && setUnread(r ? r.unread : null)).catch(() => {});
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 120_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      live = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  if (unread === null) return null;
  return (
    <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className={cn("relative flex items-center justify-center", className)}>
      <Bell aria-hidden size={22} strokeWidth={1.6} />
      {unread > 0 && <span className="absolute right-0 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
