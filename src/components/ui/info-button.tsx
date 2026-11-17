"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import { INFO, type InfoKey } from "@/lib/content/info";
import { cn } from "@/lib/format";

/** ⓘ button that opens a plain-language explainer (bottom sheet on phones, dialog on desktop). */
export function InfoButton({ topic, className, label }: { topic: InfoKey; className?: string; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const info = INFO[topic];
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      {label ? (
        <button type="button" onClick={open} className={cn("min-h-8 text-left text-xs font-bold text-success underline", className)}>
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          aria-label={info.title}
          className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full text-current", className)}
        >
          <span aria-hidden className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-current font-serif text-[10px] font-extrabold italic opacity-80">
            i
          </span>
        </button>
      )}
      <dialog
        ref={ref}
        className="sheet"
        aria-labelledby={`info-${topic}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="flex flex-col gap-3 bg-white p-4 pb-6 text-[13px] md:p-6">
          <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-black/15 md:hidden" />
          <div className="flex items-center justify-between gap-2">
            <h2 id={`info-${topic}`} className="text-[17px] font-bold">
              {info.title}
            </h2>
            <button type="button" onClick={close} aria-label="Close" className="flex size-10 items-center justify-center rounded-full bg-surface">
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className="leading-relaxed text-muted">{info.intro}</p>
          <ol className="flex flex-col gap-3">
            {info.points.map((p, i) => (
              <li key={p} className="flex gap-2.5">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-extrabold text-white">{i + 1}</span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
          <p className="rounded-md bg-success-soft p-2.5 text-xs leading-relaxed text-[#0b4f2c]">{info.fine}</p>
          <button type="button" onClick={close} className="min-h-[46px] bg-ink text-sm font-extrabold text-white">
            GOT IT
          </button>
        </div>
      </dialog>
    </>
  );
}
