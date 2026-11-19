"use client";

import { Camera, Loader2, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/images/compress";
import { browserDb } from "@/lib/supabase/browser";
import { createReviewUpload, submitReview } from "../review-actions";

/** "Write a review" for a delivered item: stars, a few words and up to 6 photos. */
export function ReviewButton({ itemId, title, author }: { itemId: string; title: string; author: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return <span className="text-[12px] font-semibold text-success">Thanks for your review</span>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-ink px-3 py-1.5 text-[12px] font-bold">Review</button>
      {open && <ReviewDialog itemId={itemId} title={title} author={author} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setDone(true); }} />}
    </>
  );
}

function ReviewDialog({ itemId, title, author, onClose, onDone }: { itemId: string; title: string; author: string; onClose: () => void; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setErr("");
    try {
      for (const f of Array.from(files).slice(0, 6 - photos.length)) {
        const c = await compressImage(f);
        const slot = await createReviewUpload(c.hash, c.ext);
        if (!slot.ok) throw new Error(slot.message);
        const { error } = await browserDb().storage.from("product-images").uploadToSignedUrl(slot.path, slot.token, c.blob, { contentType: c.type, cacheControl: "31536000", upsert: true });
        if (error) throw new Error(error.message);
        setPhotos((p) => [...p, slot.publicUrl]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="rv-h" className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-white p-0 text-ink backdrop:bg-black/50 sm:m-auto sm:max-w-md sm:rounded-3xl">
      <form
        className="flex flex-col gap-3 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await submitReview({ itemId, rating, body, photos, author }).catch(() => ({ ok: false as const, message: "You seem to be offline. Try again." }));
          setBusy(false);
          if (!r.ok) return setErr(r.message);
          onDone();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="rv-h" className="text-[17px] font-extrabold leading-snug">Review: {title}</h2>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface"><X aria-hidden size={18} /></button>
        </div>
        <div role="radiogroup" aria-label="Rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)} className="flex size-11 items-center justify-center">
              <Star aria-hidden size={30} strokeWidth={1.4} className={n <= rating ? "fill-gold text-gold" : "text-subtle"} />
            </button>
          ))}
        </div>
        <textarea rows={4} maxLength={1500} value={body} onChange={(e) => setBody(e.target.value)} placeholder="How is it? Fit, quality, colour…" className="rounded-xl border border-line p-3 text-[16px] outline-none focus:border-ink" />
        <div className="flex flex-wrap gap-2">
          {photos.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element -- just-uploaded preview
            <img key={u} src={u} alt="" className="size-16 rounded-lg object-cover" />
          ))}
          {photos.length < 6 && (
            <button type="button" disabled={busy} onClick={() => file.current?.click()} className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-[#bbb] text-[11px] font-bold disabled:opacity-50">
              {busy ? <Loader2 aria-hidden size={18} className="animate-spin" /> : <Camera aria-hidden size={18} />} Photo
            </button>
          )}
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
        </div>
        {err && <p role="alert" className="text-[13px] font-semibold text-sale">{err}</p>}
        <button type="submit" disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink font-bold text-white disabled:opacity-50">Post review</button>
        <p className="text-center text-[11px] text-muted">Reviews show after a quick check by our team. Photo reviews earn 20 points.</p>
      </form>
    </dialog>
  );
}
