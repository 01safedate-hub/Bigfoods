"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOnline } from "@/hooks/use-online";

/** Fixed notice while offline, and a short "back online" confirmation. Announced to screen readers. */
export function OfflineBanner() {
  const online = useOnline();
  const was = useRef(online);
  const [back, setBack] = useState(false);
  useEffect(() => {
    if (online && !was.current) {
      setBack(true);
      const t = setTimeout(() => setBack(false), 3000);
      was.current = online;
      return () => clearTimeout(t);
    }
    was.current = online;
  }, [online]);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[72px] z-[70] flex justify-center px-3 md:bottom-4">
      {!online && (
        <p className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">
          <WifiOff aria-hidden size={16} /> You’re offline. You can browse what’s loaded; payments wait until you reconnect.
        </p>
      )}
      {online && back && <p className="rounded-full bg-success px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">Back online</p>}
    </div>
  );
}
