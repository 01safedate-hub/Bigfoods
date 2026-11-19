"use server";

import { updateTag } from "next/cache";
import { allow, TOO_MANY } from "@/lib/rate-limit";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; message: string };

/** Upload slot for a review photo (already shrunk in the browser). */
export async function createReviewUpload(hash: unknown, ext: unknown): Promise<{ ok: true; path: string; token: string; publicUrl: string } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user || !hasSupabase) return { ok: false, message: "Sign in to add photos." };
  if (typeof hash !== "string" || !/^[a-f0-9]{16,64}$/.test(hash) || (ext !== "webp" && ext !== "jpg")) return { ok: false, message: "Bad photo." };
  if (!(await allow("review-photo", 30, 3600))) return { ok: false, message: TOO_MANY };
  const path = `reviews/${user.id}/${hash}.${ext}`;
  const storage = secretDb().storage.from("product-images");
  const { data, error } = await storage.createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return { ok: false, message: "Upload unavailable." };
  return { ok: true, path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}

/** Review an item from a delivered order. It shows on the product once our team has checked it. */
export async function submitReview(input: { itemId?: unknown; rating?: unknown; body?: unknown; photos?: unknown; author?: unknown }): Promise<Result> {
  if (!(await getSessionUser())) return { ok: false, message: "Sign in to review." };
  if (!(await allow("review", 10, 3600))) return { ok: false, message: TOO_MANY };
  const photos = Array.isArray(input.photos) ? input.photos.filter((u): u is string => typeof u === "string" && u.startsWith("https://")).slice(0, 6) : [];
  const { error } = await (await userDb()).rpc("submit_review", {
    p_item: typeof input.itemId === "string" ? input.itemId : "",
    p_rating: Number(input.rating),
    p_body: typeof input.body === "string" ? input.body.slice(0, 1500) : "",
    p_photos: photos,
    p_author: typeof input.author === "string" ? input.author.slice(0, 40) : "",
  });
  if (error) return { ok: false, message: /duplicate|unique/i.test(error.message) ? "You’ve already reviewed this item." : error.message };
  updateTag("reviews");
  return { ok: true };
}
