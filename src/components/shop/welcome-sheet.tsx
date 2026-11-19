"use client";

import { MapPin, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addMyStation, myProfile, setMyStation } from "@/app/(shop)/auth-actions";
import type { Station } from "@/lib/catalog/stations";
import { getPendingStation, getStationId, markWelcomeDone, type PendingStation, setPendingStation, setStationId, welcomeDone } from "@/lib/station-store";
import { AuthForm } from "./auth-form";
import { useSiteData } from "./site-data";
import { StationPicker } from "./station-picker";

type Step = "station" | "account";
const QUIET = /^\/(sign-in|checkout|legal|unsubscribe|offline|track|wholesale)/;

/**
 * First visit: pick your Jumia pickup station (nearest from your location, search, or add it),
 * then create an account. Shown once per device; everything can be changed later in Settings.
 */
export function WelcomeSheet() {
  const { stations } = useSiteData();
  const path = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("station");
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [picked, setPicked] = useState<Station | null>(null);
  const [pending, setPending] = useState<PendingStation | null>(null);

  useEffect(() => {
    if (welcomeDone() || QUIET.test(path)) return;
    let cancelled = false;
    // Let the page paint first; the sheet is not what people came for.
    const t = window.setTimeout(async () => {
      const me = await myProfile().catch(() => null);
      if (cancelled) return;
      if (me?.stationId) {
        setStationId(me.stationId);
        markWelcomeDone();
        return;
      }
      setSignedIn(Boolean(me));
      const local = getStationId();
      if (local && !me) {
        // Station chosen before, account not yet: ask only for the account.
        setPicked(stations.find((s) => s.id === local) ?? null);
        setStep("account");
      }
      setOpen(true);
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => {
    markWelcomeDone();
    setOpen(false);
  };

  async function choose(s: Station) {
    setPicked(s);
    setStationId(s.id);
    if (signedIn) {
      await setMyStation(s.id).catch(() => null);
      close();
      router.refresh();
    } else setStep("account");
  }

  async function add(p: PendingStation): Promise<string | null> {
    if (signedIn) {
      const r = await addMyStation(p);
      if (!r.ok) return r.message;
      setStationId(r.id);
      close();
      router.refresh();
      return null;
    }
    // Saved after the account is created.
    setPendingStation(p);
    setPending(p);
    setStep("account");
    return null;
  }

  async function accountDone() {
    const p = getPendingStation();
    if (p) {
      const r = await addMyStation(p).catch(() => null);
      if (r?.ok) setStationId(r.id);
      setPendingStation(null);
    }
    close();
    router.refresh();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="welcome-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="flex flex-col gap-4 p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-success">{step === "station" ? "STEP 1 OF 2" : signedIn ? "" : "STEP 2 OF 2"}</span>
            <h2 id="welcome-title" className="text-[22px] font-extrabold leading-tight">
              {step === "station" ? "Where should we deliver?" : "Create your account"}
            </h2>
            <p className="text-[14px] text-muted">
              {step === "station"
                ? "Delivery is free to your nearest Jumia pickup station. Share your location and we’ll find the closest ones."
                : "Track orders, keep your points and check out faster. No email verification needed."}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface"><X aria-hidden size={18} /></button>
        </div>

        {step === "station" ? (
          <StationPicker stations={stations} selected={picked?.id ?? null} onPick={(s) => void choose(s)} onAdd={add} />
        ) : (
          <>
            {(picked || pending) && (
              <button type="button" onClick={() => setStep("station")} className="flex items-center gap-2.5 rounded-xl bg-success-soft p-3 text-left">
                <MapPin aria-hidden size={18} className="shrink-0 text-success" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[11px] font-bold text-success">DELIVERING TO</span>
                  <strong className="truncate text-[14px]">{picked?.name ?? pending?.name}</strong>
                </span>
                <span className="text-[12px] font-bold underline">Change</span>
              </button>
            )}
            <AuthForm stationId={picked?.id ?? null} onDone={() => void accountDone()} />
            <button type="button" onClick={close} className="min-h-10 text-[14px] font-bold text-muted">Continue as guest</button>
          </>
        )}
      </div>
    </dialog>
  );
}
