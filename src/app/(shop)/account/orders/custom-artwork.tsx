"use client";

import { Loader2, Palette, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { compressImage } from "@/lib/images/compress";
import { naira } from "@/lib/format";
import { meetsCustomMinimum } from "@/lib/catalog/supplier";
import { browserDb } from "@/lib/supabase/browser";
import { createArtworkUpload, payArtwork, submitArtwork } from "../custom-actions";

export interface ItemCustom { id: number; status: "reviewing" | "quoted" | "paid" | "declined"; quote_ngn: number | null; staff_note: string | null; files: string[] }

/** Customisable item: send your logo after paying, then pay the customisation price before it ships. */
export function CustomArtwork({ itemId, custom, canSend: paid, minimum, pieces }: { itemId: string; custom: ItemCustom | null; canSend: boolean; minimum?: number | null; pieces: number }) {
  const short = !meetsCustomMinimum(pieces, minimum);
  const canSend = paid && !short;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, start] = useTransition();

  async function add(list: FileList | null) {
    if (!list) return;
    setUploading(true);
    setMsg("");
    try {
      for (const f of Array.from(list).slice(0, 6 - files.length)) {
        const c = await compressImage(f);
        const slot = await createArtworkUpload(c.hash, c.ext);
        if (!slot.ok) throw new Error(slot.message);
        const { error } = await browserDb().storage.from("product-images").uploadToSignedUrl(slot.path, slot.token, c.blob, { contentType: c.type, cacheControl: "31536000", upsert: true });
        if (error) throw new Error(error.message);
        setFiles((p) => [...p, slot.publicUrl]);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  const send = () => start(async () => {
    const r = await submitArtwork(itemId, files, note);
    setMsg(r.message ?? "");
    if (r.ok) { setOpen(false); setFiles([]); router.refresh(); }
  });
  const pay = () => start(async () => {
    if (!custom) return;
    const r = await payArtwork(custom.id);
    setMsg(r.message ?? "");
    if (r.ok) router.refresh();
  });

  const status = custom?.status;
  return (
    <div className="mt-1.5 flex flex-col gap-1.5 rounded-lg bg-[#FFF9EC] p-2.5 text-[12px] text-ink">
      <span className="flex items-center gap-1.5 font-bold text-[#8A5A00]"><Palette aria-hidden size={14} /> Customisable item</span>
      {status === "reviewing" && <span>Your artwork is with our team. We’ll send you the customisation price soon.</span>}
      {status === "quoted" && (
        <span className="flex flex-wrap items-center gap-2">
          Customising costs <strong>{naira(custom!.quote_ngn ?? 0)}</strong>, billed separately. Pay before it ships.
          {custom!.staff_note && <span className="w-full text-muted">“{custom!.staff_note}”</span>}
          <button type="button" disabled={busy} onClick={pay} className="min-h-9 rounded-full bg-ink px-4 font-bold text-white disabled:opacity-50">Pay {naira(custom!.quote_ngn ?? 0)} from wallet</button>
        </span>
      )}
      {status === "paid" && <span className="font-semibold text-success">Customisation paid. Your design goes to the factory with your order.</span>}
      {status === "declined" && <span className="text-sale">{custom!.staff_note ?? "We need a clearer file."} Please send it again.</span>}
      {short && !status && (
        <span className="text-[#8A5A00]">The factory customises from {minimum!.toLocaleString("en-NG")} pieces. This order has {pieces}, so it comes plain, without a logo.</span>
      )}
      {!short && !status && !canSend && <span className="text-muted">After you pay for this order, upload your logo or artwork here.</span>}
      {!short && !status && minimum && minimum > 1 && <span className="text-muted">Factory minimum for customising: {minimum.toLocaleString("en-NG")} pieces.</span>}

      {canSend && status !== "paid" && !open && (
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-9 w-fit items-center gap-1.5 rounded-full border border-[#8A5A00] px-3 font-bold text-[#8A5A00]">
          <Upload aria-hidden size={14} /> {status ? "Send a new file" : "Upload your logo or artwork"}
        </button>
      )}
      {open && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {files.map((u) => (
              <span key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview of the customer's own upload */}
                <img src={u} alt="Your artwork" className="size-14 rounded border border-line bg-white object-contain" />
                <button type="button" aria-label="Remove" onClick={() => setFiles((p) => p.filter((x) => x !== u))} className="absolute -top-1.5 -right-1.5 rounded-full bg-ink p-0.5 text-white"><X size={11} /></button>
              </span>
            ))}
            {files.length < 6 && (
              <label className="flex size-14 cursor-pointer items-center justify-center rounded border border-dashed border-[#8A5A00] bg-white">
                {uploading ? <Loader2 aria-hidden size={16} className="animate-spin" /> : <Upload aria-hidden size={16} />}
                <span className="sr-only">Add files</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void add(e.target.files)} />
              </label>
            )}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} rows={2} placeholder="Where should it go, size, colours…" className="rounded-md border border-line bg-white p-2 text-[13px]" />
          <span className="flex gap-2">
            <button type="button" disabled={busy || uploading || files.length === 0} onClick={send} className="min-h-9 rounded-full bg-ink px-4 font-bold text-white disabled:opacity-40">Send to FastChina</button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-9 px-2 font-bold text-muted">Cancel</button>
          </span>
        </div>
      )}
      {msg && <span role="status" className="text-muted">{msg}</span>}
    </div>
  );
}
