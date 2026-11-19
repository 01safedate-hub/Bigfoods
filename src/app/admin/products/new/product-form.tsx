"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { CATEGORY_PAGES } from "@/lib/content/category-pages";
import { compressImage } from "@/lib/images/compress";
import { IMAGE_RULES } from "@/lib/images/fit";
import { naira } from "@/lib/format";
import { NAIRA_PER_CNY } from "@/lib/pricing/config";
import { type CategoryKey, priceOf, SEA_ONLY } from "@/lib/pricing/engine";
import { browserDb } from "@/lib/supabase/browser";
import { createCustomProduct, createImageUpload } from "../actions";
import { combinations, LIMITS } from "../rules";

interface Photo { id: string; url: string; preview: string; note: string; state: "working" | "ready" | "failed" }
interface Row { cost: string; stock: string }

const field = "min-h-11 w-full min-w-0 rounded-md border border-[#D0D4DB] bg-white px-3 text-[14px] outline-none focus:border-ink";
const cell = "min-h-11 min-w-0 rounded-md border border-[#D0D4DB] bg-white px-3 text-[14px] outline-none focus:border-ink";
const label = "flex flex-col gap-1.5 text-[13px] font-bold";
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function ProductForm() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("fashion");
  const [badge, setBadge] = useState("");
  const [weight, setWeight] = useState("0.4");
  const [cbm, setCbm] = useState("");
  const [domestic, setDomestic] = useState("0");
  const [options, setOptions] = useState<{ name: string; values: string }[]>([{ name: "Colour", values: "" }]);
  const [currency, setCurrency] = useState<"cny" | "ngn">("cny");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [specs, setSpecs] = useState<[string, string][]>([["Material", ""]]);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ slug: string; demo?: boolean; live: boolean } | null>(null);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const sea = SEA_ONLY.has(category);
  const parsedOptions = useMemo(
    () => options.map((o) => ({ name: o.name.trim(), values: [...new Set(o.values.split(",").map((v) => v.trim()).filter(Boolean))].slice(0, LIMITS.values) })).filter((o) => o.name && o.values.length),
    [options],
  );
  const combos = useMemo(() => combinations(parsedOptions).slice(0, LIMITS.variants), [parsedOptions]);
  const keyOf = (props: Record<string, string>) => JSON.stringify(props);
  const row = (k: string): Row => rows[k] ?? { cost: "", stock: "50" };
  const setRow = (k: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [k]: { ...row(k), ...patch } }));

  /** Price preview with the standard settings. The database prices the real thing (Admin → Pricing rules). */
  const preview = (cost: string) => {
    const n = Number(cost);
    const w = Number(weight);
    if (!(n > 0) || !(w > 0)) return null;
    const cny = currency === "ngn" ? n / NAIRA_PER_CNY : n;
    return priceOf({ cny: cny + Number(domestic || 0), weightKg: w, cbm: Number(cbm) || undefined, category });
  };

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = LIMITS.images - photos.length;
    for (const file of Array.from(files).slice(0, room)) {
      const id = crypto.randomUUID();
      const local = URL.createObjectURL(file);
      setPhotos((p) => [...p, { id, url: "", preview: local, note: "Shrinking…", state: "working" }]);
      const update = (patch: Partial<Photo>) => setPhotos((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      try {
        const c = await compressImage(file);
        const preview = URL.createObjectURL(c.blob);
        URL.revokeObjectURL(local);
        update({ preview, note: `${kb(c.before)} → ${kb(c.after)}${c.warning ? " · small photo" : ""}` });
        const slot = await createImageUpload(c.hash, c.ext);
        if (!slot.ok) throw new Error(slot.message);
        if ("demo" in slot) {
          update({ url: preview, state: "ready", note: `${kb(c.after)} · demo, not uploaded` });
          continue;
        }
        const { error: upErr } = await browserDb().storage.from("product-images").uploadToSignedUrl(slot.path, slot.token, c.blob, { contentType: c.type, cacheControl: "31536000", upsert: true });
        if (upErr) throw new Error(upErr.message);
        update({ url: slot.publicUrl, state: "ready", note: `${kb(c.before)} → ${kb(c.after)}` });
      } catch (e) {
        update({ state: "failed", note: e instanceof Error ? e.message : "Upload failed" });
      }
    }
  }

  function submit(status: "draft" | "active") {
    setError("");
    if (photos.some((p) => p.state === "working")) return setError("Wait for the photos to finish uploading.");
    if (status === "active" && !photos.some((p) => p.state === "ready")) return setError("Add at least one photo before publishing.");
    const variants = combos.map((props) => {
      const r = row(keyOf(props));
      return { props, cost: Number(r.cost), currency, stock: Number(r.stock || 0), image: null };
    });
    start(async () => {
      const r = await createCustomProduct({
        title, description, category, status, badge,
        weight_kg: Number(weight), cbm: sea && cbm ? Number(cbm) : null, domestic_cny: Number(domestic || 0),
        images: photos.filter((p) => p.state === "ready").map((p) => p.url),
        options: parsedOptions,
        specs: specs.filter(([k, v]) => k.trim() && v.trim()),
        variants,
      }).catch(() => ({ ok: false as const, message: "Couldn’t reach the server. Check your connection and try again." }));
      if (!r.ok) return setError(r.message);
      setDone({ slug: r.slug, demo: r.demo, live: status === "active" });
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-[#E3E5EA] bg-white p-6">
        <h2 className="text-lg font-extrabold">{done.demo ? "Demo: checked, not saved" : done.live ? "Product is live" : "Saved as a draft"}</h2>
        <p className="text-[#5B6170]">{done.demo ? "Connect the database to save products." : "Prices were set by the pricing engine, with every promotion inside the profit guardrails."}</p>
        <div className="flex flex-wrap gap-2">
          {!done.demo && <Link href={`/product/${done.slug}`} className="flex min-h-10 items-center gap-1.5 rounded-md bg-ink px-4 font-bold text-white">View product <ArrowRight aria-hidden size={15} /></Link>}
          <button type="button" onClick={() => window.location.reload()} className="min-h-10 rounded-md border border-[#D0D4DB] px-4 font-bold">Add another</button>
          <Link href="/admin/products" className="flex min-h-10 items-center rounded-md px-3 font-bold">All products</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit("active"); }}>
      <Link href="/admin/products" className="flex items-center gap-1 self-start text-[13px] font-bold text-[#5B6170]"><ArrowLeft aria-hidden size={14} /> Products</Link>
      <h1 className="text-2xl font-extrabold">Add a custom product</h1>
      <p className="-mt-2 max-w-2xl text-[#5B6170]">For products you add by hand (not from the supplier import). Enter what it costs us; the pricing engine sets every price (list, Midnight, event, flash, retailer) with the same profit guardrails as imports.</p>

      <section aria-labelledby="ph" className="flex flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="ph" className="font-extrabold">Photos</h2>
          <span className="text-xs text-[#5B6170]">{photos.length}/{LIMITS.images} · first photo is the cover</span>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p, i) => (
            <li key={p.id} className="relative flex flex-col gap-1">
              <span className="relative aspect-square overflow-hidden rounded-md bg-[#F4F5F7]">
                {/* eslint-disable-next-line @next/next/no-img-element -- local previews (blob: URLs) */}
                <img src={p.preview} alt={`Photo ${i + 1}`} className={`size-full object-cover ${p.state === "working" ? "opacity-50" : ""}`} />
                {p.state === "working" && <Loader2 aria-label="Uploading" className="absolute inset-0 m-auto animate-spin" size={22} />}
                {i === 0 && p.state === "ready" && <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">COVER</span>}
              </span>
              <span className={`truncate text-[11px] ${p.state === "failed" ? "text-sale" : "text-[#5B6170]"}`} title={p.note}>{p.note}</span>
              <span className="flex gap-1">
                {i > 0 && (
                  <button type="button" aria-label="Make cover photo" onClick={() => setPhotos((ps) => [p, ...ps.filter((x) => x.id !== p.id)])} className="flex size-7 items-center justify-center rounded border border-[#D0D4DB]"><Star aria-hidden size={13} /></button>
                )}
                <button type="button" aria-label="Remove photo" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} className="flex size-7 items-center justify-center rounded border border-[#D0D4DB]"><X aria-hidden size={13} /></button>
              </span>
            </li>
          ))}
          {photos.length < LIMITS.images && (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); void addFiles(e.dataTransfer.files); }}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[#D0D4DB] text-xs font-bold text-[#5B6170] hover:border-ink"
              >
                <ImagePlus aria-hidden size={22} /> Add photos
              </button>
            </li>
          )}
        </ul>
        <input ref={fileInput} type="file" accept={IMAGE_RULES.accept.join(",")} multiple hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
        <p className="text-xs text-[#5B6170]">Photos are shrunk on this device before upload (max 1600px, WebP, location data removed), then stored for a year-long cache. Square photos of at least 800px look best.</p>
      </section>

      <section aria-labelledby="dt" className="grid gap-3 rounded-lg border border-[#E3E5EA] bg-white p-4 md:grid-cols-2">
        <h2 id="dt" className="font-extrabold md:col-span-2">Details</h2>
        <label className={`${label} md:col-span-2`}>Name
          <input required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ribbed knit two-piece set" className={field} />
          <span className="text-[11px] font-normal text-[#5B6170]">Write it the way people search: what it is, material, key feature. {title.length}/140</span>
        </label>
        <label className={`${label} md:col-span-2`}>Description
          <textarea rows={4} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} className={`${field} py-2`} placeholder="What it is, who it’s for, sizes, what’s in the box." />
        </label>
        <label className={label}>Category
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)} className={field}>
            {Object.entries(CATEGORY_PAGES).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
          </select>
          <span className="text-[11px] font-normal text-[#5B6170]">{sea ? "Ships by sea (90+ days), priced by volume." : "Ships by air (10+ days), priced by weight."}</span>
        </label>
        <label className={label}>Badge <span className="font-normal text-[#5B6170]">(optional)</span>
          <input maxLength={16} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. New in" className={field} />
        </label>
        <label className={label}>Weight per item (kg)
          <input required inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className={field} />
        </label>
        {sea ? (
          <label className={label}>Volume per item (CBM)
            <input required inputMode="decimal" value={cbm} onChange={(e) => setCbm(e.target.value)} placeholder="e.g. 0.3" className={field} />
          </label>
        ) : (
          <label className={label}>Delivery inside China (¥ per item)
            <input inputMode="decimal" value={domestic} onChange={(e) => setDomestic(e.target.value)} className={field} />
          </label>
        )}
      </section>

      <section aria-labelledby="op" className="flex flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-4">
        <h2 id="op" className="font-extrabold">Options</h2>
        {options.map((o, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[180px_1fr_auto]">
            <input aria-label={`Option ${i + 1} name`} value={o.name} onChange={(e) => setOptions((os) => os.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Colour, Size, Length…" className={`${field} max-sm:col-span-2`} />
            <input aria-label={`Option ${i + 1} values, comma separated`} value={o.values} onChange={(e) => setOptions((os) => os.map((x, j) => (j === i ? { ...x, values: e.target.value } : x)))} placeholder="Black, Wine, Navy" className={field} />
            <button type="button" aria-label="Remove option" onClick={() => setOptions((os) => os.filter((_, j) => j !== i))} className="flex size-11 items-center justify-center rounded-md border border-[#D0D4DB]"><Trash2 aria-hidden size={15} /></button>
          </div>
        ))}
        {options.length < LIMITS.options && (
          <button type="button" onClick={() => setOptions((os) => [...os, { name: "", values: "" }])} className="flex items-center gap-1 self-start text-[13px] font-bold"><Plus aria-hidden size={14} /> Add option</button>
        )}
        <p className="text-xs text-[#5B6170]">Separate values with commas. No options? Leave it empty and the product has a single variant.</p>
      </section>

      <section aria-labelledby="vr" className="flex flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="vr" className="font-extrabold">Cost &amp; stock · {combos.length} variant{combos.length === 1 ? "" : "s"}</h2>
          <span role="radiogroup" aria-label="Cost currency" className="flex rounded-md border border-[#D0D4DB] p-0.5 text-xs font-bold">
            {(["cny", "ngn"] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={currency === c} onClick={() => setCurrency(c)} className={`min-h-8 rounded px-3 ${currency === c ? "bg-ink text-white" : ""}`}>{c === "cny" ? "Cost in ¥" : "Cost in ₦"}</button>
            ))}
          </span>
        </div>
        {combos.length > 1 && (
          <div className="flex flex-wrap items-end gap-2 rounded-md bg-[#F7F8FA] p-2.5">
            <span className="text-xs font-bold">Set all:</span>
            <input aria-label="Cost for all variants" inputMode="decimal" placeholder={currency === "cny" ? "¥ cost" : "₦ cost"} onChange={(e) => setRows(Object.fromEntries(combos.map((c) => [keyOf(c), { ...row(keyOf(c)), cost: e.target.value }])))} className={`${cell} w-28`} />
            <input aria-label="Stock for all variants" inputMode="numeric" placeholder="Stock" onChange={(e) => setRows(Object.fromEntries(combos.map((c) => [keyOf(c), { ...row(keyOf(c)), stock: e.target.value }])))} className={`${cell} w-24`} />
          </div>
        )}
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-xs text-[#5B6170]">
              <tr><th className="py-2 pr-2">Variant</th><th className="pr-2">Cost ({currency === "cny" ? "¥" : "₦"})</th><th className="pr-2">Stock</th><th className="pr-2 text-right">Price</th><th className="text-right">10+ price</th></tr>
            </thead>
            <tbody>
              {combos.map((props) => {
                const k = keyOf(props);
                const r = row(k);
                const p = preview(r.cost);
                const name = Object.values(props).join(" / ") || "Standard";
                return (
                  <tr key={k} className="border-t border-[#EEF0F3]">
                    <th scope="row" className="py-2 pr-2 font-semibold">{name}</th>
                    <td className="pr-2"><input aria-label={`Cost for ${name}`} required inputMode="decimal" value={r.cost} onChange={(e) => setRow(k, { cost: e.target.value })} className={`${cell} w-28`} /></td>
                    <td className="pr-2"><input aria-label={`Stock for ${name}`} inputMode="numeric" value={r.stock} onChange={(e) => setRow(k, { stock: e.target.value })} className={`${cell} w-24`} /></td>
                    <td className="pr-2 text-right font-bold tabular-nums">{p ? naira(p.list) : "—"}</td>
                    <td className="text-right tabular-nums text-[#5B6170]">{p ? naira(p.retailer) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#5B6170]">Estimated with the standard rates (₦{NAIRA_PER_CNY} per ¥1, freight and ₦1,800/kg clearing included). The live prices come from Admin → Pricing rules when you save.</p>
      </section>

      <section aria-labelledby="sp" className="flex flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-4">
        <h2 id="sp" className="font-extrabold">Specifications</h2>
        {specs.map(([k, v], i) => (
          <div key={i} className="grid grid-cols-[1fr_1.6fr_auto] gap-2">
            <input aria-label={`Spec ${i + 1} name`} value={k} onChange={(e) => setSpecs((s) => s.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} placeholder="Material" className={field} />
            <input aria-label={`Spec ${i + 1} value`} value={v} onChange={(e) => setSpecs((s) => s.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} placeholder="Cotton blend" className={field} />
            <button type="button" aria-label="Remove spec" onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))} className="flex size-11 items-center justify-center rounded-md border border-[#D0D4DB]"><Trash2 aria-hidden size={15} /></button>
          </div>
        ))}
        {specs.length < LIMITS.specs && <button type="button" onClick={() => setSpecs((s) => [...s, ["", ""]])} className="flex items-center gap-1 self-start text-[13px] font-bold"><Plus aria-hidden size={14} /> Add spec</button>}
      </section>

      {error && <p role="alert" className="rounded-md bg-sale-soft px-3 py-2.5 font-semibold text-sale">{error}</p>}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-[#E3E5EA] bg-[#F7F8FA]/95 px-4 py-3 backdrop-blur">
        <button type="button" disabled={pending} onClick={() => submit("draft")} className="min-h-11 rounded-md border border-[#D0D4DB] bg-white px-4 font-bold disabled:opacity-50">Save draft</button>
        <button type="submit" disabled={pending} className="flex min-h-11 items-center gap-1.5 rounded-md bg-ink px-5 font-bold text-white disabled:opacity-50">{pending && <Loader2 aria-hidden size={15} className="animate-spin" />} Publish</button>
      </div>
    </form>
  );
}
