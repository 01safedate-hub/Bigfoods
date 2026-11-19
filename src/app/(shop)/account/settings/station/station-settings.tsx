"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSiteData } from "@/components/shop/site-data";
import { StationPicker } from "@/components/shop/station-picker";
import type { Station } from "@/lib/catalog/stations";
import { setStationId, useStationId } from "@/lib/station-store";
import { addMyStation, setMyStation } from "../../../auth-actions";

type Current = { id: string; name: string; area: string; state: string; verified: boolean } | null;

export function StationSettings({ signedIn, current }: { signedIn: boolean; current: Current }) {
  const { stations } = useSiteData();
  const router = useRouter();
  const local = useStationId();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const shown: Current | Station | null = current ?? stations.find((s) => s.id === local) ?? null;

  async function pick(s: Station) {
    setStationId(s.id);
    if (signedIn) {
      const r = await setMyStation(s.id).catch(() => ({ ok: false as const, message: "Offline. Saved on this device; we’ll update your account later." }));
      setMsg(r.ok ? { ok: true, text: `Saved: ${s.name}` } : { ok: false, text: r.message });
      router.refresh();
    } else setMsg({ ok: true, text: `Saved on this device: ${s.name}. Sign in to keep it on your account.` });
  }

  return (
    <div className="flex flex-col gap-4">
      {shown && (
        <div className="flex items-start gap-3 rounded-xl bg-success-soft p-3.5">
          <MapPin aria-hidden size={20} className="mt-0.5 shrink-0 text-success" />
          <span className="flex flex-col">
            <span className="text-[11px] font-extrabold tracking-wider text-success">PRIMARY STATION</span>
            <strong className="text-[15px]">{shown.name}</strong>
            <span className="text-[13px] text-muted">{shown.area}, {shown.state}{"verified" in shown && shown.verified === false ? " · added by you, we’ll check it before your first order ships" : ""}</span>
          </span>
        </div>
      )}
      {msg && <p role="status" className={`text-[13px] font-semibold ${msg.ok ? "text-success" : "text-sale"}`}>{msg.text}</p>}
      <StationPicker
        stations={stations}
        selected={shown?.id ?? null}
        onPick={(s) => void pick(s)}
        onAdd={async (p) => {
          if (!signedIn) return "Create an account or sign in to add your own station.";
          const r = await addMyStation(p);
          if (!r.ok) return r.message;
          setStationId(r.id);
          setMsg({ ok: true, text: "Station added. We’ll check it before your first order ships." });
          router.refresh();
          return null;
        }}
      />
    </div>
  );
}
