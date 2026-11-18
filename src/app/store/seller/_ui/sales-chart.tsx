"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import { ngn } from "./ui";

/** 30-day area chart with a Sales / Visits switch and a readable value under your finger or cursor. */
export function SalesChart({ daily }: { daily: { d: string; sales: number; visits: number }[] }) {
  const [metric, setMetric] = useState<"sales" | "visits">("sales");
  const [hover, setHover] = useState<number | null>(null);
  const vals = daily.map((x) => x[metric]);
  const max = Math.max(1, ...vals);
  const W = 600, H = 180, step = W / Math.max(1, vals.length - 1);
  const pts = vals.map((v, i) => [i * step, H - 8 - (v / max) * (H - 24)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const i = hover ?? vals.length - 1;
  const fmt = (v: number) => (metric === "sales" ? ngn(v) : `${v.toLocaleString("en-NG")} visits`);
  const date = !daily[i] ? "" : new Date(daily[i].d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <span className="text-[12px] text-[#8A8A93]">{hover === null ? "Today" : date}</span>
          <strong className="block text-[22px] font-black tabular-nums">{fmt(vals[i] ?? 0)}</strong>
        </div>
        <div role="tablist" aria-label="Chart" className="flex rounded-full bg-[#0E0E10] p-1">
          {(["sales", "visits"] as const).map((m) => (
            <button key={m} role="tab" type="button" aria-selected={metric === m} onClick={() => setMetric(m)}
              className={cn("min-h-8 rounded-full px-3.5 text-[12px] font-bold capitalize", metric === m ? "bg-white text-black" : "text-[#A1A1AA]")}>{m}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full touch-none" role="img" aria-label={`${metric} for the last 30 days, highest ${fmt(max)}`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(vals.length - 1, Math.round(((e.clientX - r.left) / r.width) * (vals.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F5C542" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F5C542" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#fill)" />
        <path d={line} fill="none" stroke="#F5C542" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {pts[i] && <circle cx={pts[i][0]} cy={pts[i][1]} r="5" fill="#0E0E10" stroke="#F5C542" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}
