"use client";

import { Ruler, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CHARTS, cmToIn, recommend, rowMatches, type SizeKind } from "@/lib/catalog/size-guide";
import { cn } from "@/lib/format";

const KEY = "fc-body";
const readBody = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
};

/** "Size guide ›" button and its sheet: the chart for this kind of item, and a find-my-size helper. */
export function SizeGuide({ kind, sizes, onPick }: { kind: SizeKind; sizes: string[]; onPick?: (names: string[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-10 w-full items-center gap-2 rounded-md border border-ink px-3 text-[13px] font-bold">
        <Ruler aria-hidden size={16} /> Size guide
        <span className="ml-auto truncate font-normal text-muted">{sizes.slice(0, 8).join(", ")}</span>
        <span aria-hidden>›</span>
      </button>
      {open && <SizeSheet kind={kind} sizes={sizes} onClose={() => setOpen(false)} onPick={onPick} />}
    </>
  );
}

function SizeSheet({ kind, sizes, onClose, onPick }: { kind: SizeKind; sizes: string[]; onClose: () => void; onPick?: (names: string[]) => void }) {
  const chart = CHARTS[kind];
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"chart" | "find">("chart");
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [system, setSystem] = useState<"eu" | "uk" | "us">("eu");
  const [body, setBody] = useState<Record<string, number>>(() => {
    const saved = readBody();
    return Object.fromEntries(chart.ask.map((a) => [a.key, saved[a.key] ?? a.start]));
  });
  useEffect(() => { ref.current?.showModal(); }, []);
  const offered = chart.rows.filter((r) => rowMatches(r, sizes));
  const best = recommend(chart, body, offered.length ? sizes : undefined);
  const fmt = (v: [number, number]) => (unit === "cm" ? `${v[0]}–${v[1]}` : `${cmToIn(v[0])}–${cmToIn(v[1])}`);
  const set = (k: string, v: number) => {
    const next = { ...body, [k]: v };
    setBody(next);
    try { localStorage.setItem(KEY, JSON.stringify({ ...readBody(), ...next })); } catch {}
  };
  const label = (r: (typeof chart.rows)[number]) => (chart.systems ? String(r[system]) : r.label);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="sg-h" className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-2xl bg-white p-0 backdrop:bg-black/50 md:m-auto md:max-w-xl md:rounded-2xl">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-white px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 id="sg-h" className="text-[17px] font-extrabold">{chart.title}</h2>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="flex size-10 items-center justify-center rounded-full bg-surface"><X size={18} /></button>
        </div>
        <div role="tablist" className="flex gap-5 text-[14px]">
          {([["chart", "Size guide"], ["find", "Find my size"]] as const).map(([k, t]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("border-b-[3px] pb-2", tab === k ? "border-ink font-extrabold" : "border-transparent text-muted")}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {chart.systems && (
            <span className="flex overflow-hidden rounded-full border border-line text-[12px] font-bold">
              {chart.systems.map((s) => <button key={s.key} type="button" aria-pressed={system === s.key} onClick={() => setSystem(s.key)} className={cn("min-h-8 px-3", system === s.key ? "bg-ink text-white" : "")}>{s.label}</button>)}
            </span>
          )}
          <span className="flex overflow-hidden rounded-full border border-line text-[12px] font-bold">
            {(["cm", "in"] as const).map((u) => <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)} className={cn("min-h-8 px-3 uppercase", unit === u ? "bg-ink text-white" : "")}>{u}</button>)}
          </span>
        </div>

        {tab === "find" && (
          <div className="flex flex-col gap-4 rounded-xl bg-surface p-3">
            {chart.ask.map((a) => (
              <label key={a.key} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between text-[14px] font-bold">{a.label}
                  <span className="rounded-md border border-line bg-white px-2 py-0.5 tabular-nums">{unit === "cm" ? `${body[a.key]} cm` : `${cmToIn(body[a.key])} in`}</span>
                </span>
                <input type="range" min={a.min} max={a.max} step={a.key === "foot" ? 0.1 : 1} value={body[a.key]} onChange={(e) => set(a.key, Number(e.target.value))} className="w-full accent-[#E8762B]" />
              </label>
            ))}
            {best && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-white p-3">
                <span className="text-[14px]">Your size: <strong className="text-[20px]">{label(best)}</strong>{chart.systems && <span className="text-muted"> ({system.toUpperCase()})</span>}</span>
                {onPick && <button type="button" onClick={() => { onPick([best.label, ...(best.aliases ?? [])]); ref.current?.close(); }} className="min-h-10 rounded-full bg-ink px-4 text-[13px] font-extrabold text-white">Choose {label(best)}</button>}
              </div>
            )}
            <p className="text-[12px] text-muted">We save these on this phone only, to suggest sizes next time.</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[320px] text-center text-[13px] tabular-nums">
            <thead className="bg-surface text-[12px]">
              <tr>
                <th className="px-2 py-2.5 text-left font-bold">Size</th>
                {chart.systems && chart.systems.filter((s) => s.key !== system).map((s) => <th key={s.key} className="px-2 py-2.5 font-bold">{s.label}</th>)}
                {chart.measures.map((m) => <th key={m.key} className="px-2 py-2.5 font-bold">{m.label} <span className="font-normal text-muted">({unit})</span></th>)}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r) => {
                const sold = !sizes.length || rowMatches(r, sizes);
                const pick = best?.label === r.label && tab === "find";
                return (
                  <tr key={r.label} className={cn("border-t border-line", pick && "bg-[#FDF1E7] font-bold", !sold && "text-subtle")}>
                    <td className="px-2 py-2.5 text-left font-bold">{label(r)}{!sold && <span className="ml-1 text-[10px] font-normal">not sold</span>}</td>
                    {chart.systems && chart.systems.filter((s) => s.key !== system).map((s) => <td key={s.key} className="px-2 py-2.5">{String(r[s.key])}</td>)}
                    {chart.measures.map((m) => <td key={m.key} className="px-2 py-2.5">{fmt(r[m.key] as [number, number])}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] leading-relaxed text-muted">{chart.note} Body measurements; the supplier’s own sizes may differ by 1–2 cm.</p>
      </div>
    </dialog>
  );
}
