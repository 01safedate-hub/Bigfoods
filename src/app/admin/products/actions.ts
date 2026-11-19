"use server";

import { updateTag } from "next/cache";
import { pingIndexNow } from "@/lib/indexnow";
import { SHOP_URL } from "@/lib/seo";
import { requireStaff } from "@/lib/supabase/auth";
import { hasSupabase, SUPABASE_URL } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";
import { CATEGORY_ICON, type CustomProductInput, validateCustomProduct } from "./rules";

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

/** Roles that may add or change products. */
const CATALOG_ROLES = ["super_admin", "purchasing", "marketing"];
const BUCKET = "product-images";

async function requireCatalogRole(): Promise<{ demo: boolean } | { error: string }> {
  const me = await requireStaff();
  if (!hasSupabase || !me) return { demo: true };
  const { data } = await secretDb().from("profiles").select("role").eq("id", me.id).maybeSingle();
  return CATALOG_ROLES.includes(data?.role ?? "") ? { demo: false } : { error: "Only Super admin, Purchasing or Marketing can add products." };
}

/**
 * A one-time upload address for one photo. The browser has already shrunk the photo; the file
 * name is its content fingerprint, so the stored image never changes and is cached for a year.
 */
export async function createImageUpload(hash: unknown, ext: unknown): Promise<Result<{ path: string; token: string; publicUrl: string } | { demo: true }>> {
  const role = await requireCatalogRole();
  if ("error" in role) return { ok: false, message: role.error };
  if (typeof hash !== "string" || !/^[a-f0-9]{16,64}$/.test(hash) || (ext !== "webp" && ext !== "jpg")) return { ok: false, message: "Bad photo." };
  if (role.demo) return { ok: true, demo: true };
  const path = `custom/${hash}.${ext}`;
  const storage = secretDb().storage.from(BUCKET);
  const { data, error } = await storage.createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return { ok: false, message: error?.message ?? "Upload unavailable." };
  return { ok: true, path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}

export async function createCustomProduct(raw: unknown): Promise<Result<{ slug: string; demo?: boolean }>> {
  const role = await requireCatalogRole();
  if ("error" in role) return { ok: false, message: role.error };
  const ourImages = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  const checked = validateCustomProduct(raw, role.demo ? null : ourImages);
  if (!checked.ok) return checked;
  const p: CustomProductInput = checked.value;
  if (role.demo) return { ok: true, slug: "demo-product", demo: true };

  const { data, error } = await secretDb().rpc("create_custom_product", {
    p: {
      ...p,
      icon: CATEGORY_ICON[p.category],
      options: p.options.map((o) => ({ name: o.name, values: o.values.map((label) => ({ label })) })),
      variants: p.variants.map((v) => ({ ...v, label: Object.values(v.props).join(" / ") })),
    },
  });
  if (error) return { ok: false, message: error.message };
  const slug = data as string;
  updateTag("catalog");
  if (p.status === "active") await pingIndexNow([`${SHOP_URL}/product/${slug}`, `${SHOP_URL}/category/${p.category}`]);
  return { ok: true, slug };
}

const STATUSES = ["draft", "active", "hidden", "sold_out"] as const;

export async function setProductStatus(slug: unknown, status: unknown): Promise<Result> {
  const role = await requireCatalogRole();
  if ("error" in role) return { ok: false, message: role.error };
  if (typeof slug !== "string" || !STATUSES.includes(status as (typeof STATUSES)[number])) return { ok: false, message: "Unknown status." };
  if (role.demo) return { ok: true };
  const { error } = await secretDb().from("products").update({ status, updated_at: new Date().toISOString() }).eq("slug", slug);
  if (error) return { ok: false, message: error.message };
  updateTag("catalog");
  updateTag(`product:${slug}`);
  if (status === "active") await pingIndexNow([`${SHOP_URL}/product/${slug}`]);
  return { ok: true };
}
