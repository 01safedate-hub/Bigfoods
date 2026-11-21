"use server";

import { allow, TOO_MANY } from "@/lib/rate-limit";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

type Result = { ok: true; message?: string } | { ok: false; message: string };

/** Upload slot for a logo or artwork file (shrunk in the browser first). */
export async function createArtworkUpload(hash: unknown, ext: unknown): Promise<{ ok: true; path: string; token: string; publicUrl: string } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user || !hasSupabase) return { ok: false, message: "Sign in to upload." };
  if (typeof hash !== "string" || !/^[a-f0-9]{16,64}$/.test(hash) || (ext !== "webp" && ext !== "jpg")) return { ok: false, message: "Bad file." };
  if (!(await allow("artwork", 30, 3600))) return { ok: false, message: TOO_MANY };
  const path = `artwork/${user.id}/${hash}.${ext}`;
  const storage = secretDb().storage.from("product-images");
  const { data, error } = await storage.createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return { ok: false, message: "Upload unavailable." };
  return { ok: true, path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}

/** Send logo/artwork for a customisable item. Our team prices it and the customer pays before it ships. */
export async function submitArtwork(itemId: unknown, files: unknown, note: unknown): Promise<Result> {
  if (!(await getSessionUser())) return { ok: false, message: "Sign in first." };
  if (!(await allow("artwork-send", 20, 3600))) return { ok: false, message: TOO_MANY };
  const list = Array.isArray(files) ? files.filter((u): u is string => typeof u === "string" && u.startsWith("https://")).slice(0, 6) : [];
  const { error } = await (await userDb()).rpc("submit_customisation", {
    p_item: typeof itemId === "string" ? itemId : "", p_files: list, p_note: typeof note === "string" ? note.slice(0, 600) : "",
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Sent. We’ll check it with the factory and send you the price." };
}

/** Pay a customisation price from the FastChina wallet. */
export async function payArtwork(id: unknown): Promise<Result> {
  if (!(await getSessionUser())) return { ok: false, message: "Sign in first." };
  if (typeof id !== "number") return { ok: false, message: "Nothing to pay." };
  const { error } = await (await userDb()).rpc("pay_customisation", { p_id: id });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Paid. Thank you!" };
}
