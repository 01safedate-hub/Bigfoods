"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { compressImage } from "@/lib/images/compress";
import { browserDb } from "@/lib/supabase/browser";
import { addItemPhoto, createWarehouseUpload } from "../actions";

/** Warehouse photo check: staff photograph each item in China; customers see it when they track the order. */
export function ItemPhotos({ itemId, photos }: { itemId: string; photos: string[] }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg("");
    try {
      for (const f of Array.from(files).slice(0, 4)) {
        const c = await compressImage(f);
        const slot = await createWarehouseUpload(c.hash, c.ext);
        if (!slot.ok) throw new Error(slot.message);
        if ("demo" in slot) { setMsg("Demo: not uploaded."); continue; }
        const { error } = await browserDb().storage.from("product-images").uploadToSignedUrl(slot.path, slot.token, c.blob, { contentType: c.type, cacheControl: "31536000", upsert: true });
        if (error) throw new Error(error.message);
        const r = await addItemPhoto(itemId, slot.publicUrl);
        if (!r.ok) throw new Error(r.message);
      }
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {photos.map((u) => (
        // eslint-disable-next-line @next/next/no-img-element -- small staff thumbnails
        <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="size-12 rounded object-cover" /></a>
      ))}
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex min-h-9 items-center gap-1.5 rounded-md border border-dashed border-[#9AA1AD] px-2.5 text-xs font-bold disabled:opacity-50">
        {busy ? <Loader2 aria-hidden size={14} className="animate-spin" /> : <Camera aria-hidden size={14} />} {photos.length ? "Add photo" : "Warehouse photo"}
      </button>
      <input ref={input} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      {msg && <span className="text-xs text-[#B42318]">{msg}</span>}
    </div>
  );
}
