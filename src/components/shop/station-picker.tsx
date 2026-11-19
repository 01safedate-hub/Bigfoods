"use client";

import { Check, Loader2, LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Station } from "@/lib/catalog/stations";
import { cn } from "@/lib/format";
import { insideNigeria, NIGERIAN_STATES, nearestState, nearestStations, searchStations } from "@/lib/geo";
import type { PendingStation } from "@/lib/station-store";

type Near = { station: Station; km: number }[];

/**
 * Choose a Jumia pickup station: from your location (nearest first), by searching, or by adding
 * the one you use if it isn't listed yet.
 */
export function StationPicker({
  stations, selected, onPick, onAdd, compact,
}: {
  stations: readonly Station[];
  selected: string | null;
  onPick: (s: Station) => void;
  /** Called with a station the customer typed in. Return an error message to show, or null. */
  onAdd: (p: PendingStation) => Promise<string | null>;
  compact?: boolean;
}) {
  const [q, setQ] = useState("");
  const [near, setNear] = useState<Near | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [adding, setAdding] = useState(false);
  const results = useMemo(() => (q.trim() ? searchStations(q, stations).slice(0, 8) : []), [q, stations]);

  function locate() {
    setGeoMsg("");
    if (!("geolocation" in navigator)) return setGeoMsg("This browser can’t share your location. Search for your area instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const here: [number, number] = [p.coords.latitude, p.coords.longitude];
        if (!insideNigeria(here)) return setGeoMsg("You seem to be outside Nigeria. Search for the area you want delivery in.");
        setCoords(here);
        setNear(nearestStations(here, stations, 3));
      },
      (e) => {
        setLocating(false);
        setGeoMsg(e.code === e.PERMISSION_DENIED ? "Location is off. Search for your area instead, or allow location in your browser settings." : "Couldn’t get your location. Search for your area instead.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }

  const row = (s: Station, note?: string) => (
    <li key={s.id}>
      <button
        type="button"
        role="radio"
        aria-checked={selected === s.id}
        onClick={() => onPick(s)}
        className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left", selected === s.id ? "border-ink bg-surface" : "border-line hover:border-[#bbb]")}
      >
        <MapPin aria-hidden size={18} className="mt-0.5 shrink-0 text-success" />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-[14px] leading-snug">{s.name}</strong>
          <span className="text-[12px] text-muted">{[s.area, s.state].filter(Boolean).join(", ")}{s.address ? ` · ${s.address}` : ""}{s.hours ? ` · ${s.hours}` : ""}</span>
        </span>
        {note && <span className="shrink-0 text-[12px] font-bold text-muted">{note}</span>}
        {selected === s.id && <Check aria-hidden size={18} className="shrink-0" />}
      </button>
    </li>
  );

  if (adding) return <AddStation defaultState={coords ? nearestState(coords) : ""} coords={coords} onCancel={() => setAdding(false)} onAdd={onAdd} />;

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={locate} disabled={locating} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-bold text-white disabled:opacity-60">
        {locating ? <Loader2 aria-hidden size={18} className="animate-spin" /> : <LocateFixed aria-hidden size={18} />}
        {locating ? "Finding stations near you…" : "Use my location"}
      </button>
      {geoMsg && <p role="status" className="rounded-lg bg-[#FFF7E0] px-3 py-2 text-[13px] text-gold-ink">{geoMsg}</p>}

      {near && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[13px] font-bold">Closest to you</h3>
          <ul role="radiogroup" aria-label="Closest pickup stations" className="flex flex-col gap-2">
            {near.map(({ station, km }) => row(station, km < 1 ? "<1 km" : `${Math.round(km)} km`))}
          </ul>
          {near[0] && near[0].km > 25 && <p className="text-[12px] text-muted">The nearest listed station is {Math.round(near[0].km)} km away. If you use a closer Jumia station, add it below.</p>}
        </div>
      )}

      <label className="relative flex items-center">
        <Search aria-hidden size={17} className="pointer-events-none absolute left-3.5 text-muted" />
        <span className="sr-only">Search pickup stations</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search area, city or state (e.g. Ikeja)"
          className="min-h-12 w-full rounded-full border border-line bg-white pr-4 pl-10 text-[15px] outline-none focus:border-ink"
        />
      </label>
      {q.trim() && (
        <ul role="radiogroup" aria-label="Matching pickup stations" className={cn("flex flex-col gap-2", !compact && "max-h-[40vh] overflow-y-auto")}>
          {results.length ? results.map((s) => row(s)) : <li className="rounded-xl bg-surface p-3 text-[13px] text-muted">No listed station matches “{q}”.</li>}
        </ul>
      )}
      <button type="button" onClick={() => setAdding(true)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-dashed border-[#bbb] text-[14px] font-bold">
        <Plus aria-hidden size={16} /> My station isn’t listed: add it
      </button>
    </div>
  );
}

function AddStation({ defaultState, coords, onCancel, onAdd }: { defaultState: string; coords: [number, number] | null; onCancel: () => void; onAdd: (p: PendingStation) => Promise<string | null> }) {
  const [f, setF] = useState({ state: defaultState, area: "", name: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = "min-h-11 w-full rounded-lg border border-line bg-white px-3 text-[15px] outline-none focus:border-ink";
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        if (!f.state || f.area.trim().length < 2 || f.name.trim().length < 3) return setErr("Fill in the state, area and station name.");
        setBusy(true);
        const msg = await onAdd({ ...f, lat: coords?.[0], lng: coords?.[1] }).catch(() => "Couldn’t save. Check your connection.");
        setBusy(false);
        if (msg) setErr(msg);
      }}
    >
      <p className="text-[13px] text-muted">Type the Jumia pickup station you use, as it appears on Jumia. We check it before your first order ships.</p>
      <label className="flex flex-col gap-1 text-[13px] font-bold">State
        <select required value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} className={input}>
          <option value="">Choose a state</option>
          {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Area or town
        <input required value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="e.g. Ogba" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Station name
        <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Jumia Pickup Station – Ogba" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Address <span className="font-normal text-muted">(optional)</span>
        <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Street and landmark" className={input} />
      </label>
      {err && <p role="alert" className="text-[13px] font-semibold text-sale">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 flex-1 rounded-full border border-line font-bold">Back</button>
        <button type="submit" disabled={busy} className="flex min-h-11 flex-[2] items-center justify-center gap-1.5 rounded-full bg-ink font-bold text-white disabled:opacity-60">
          {busy && <Loader2 aria-hidden size={16} className="animate-spin" />} Save station
        </button>
      </div>
    </form>
  );
}
