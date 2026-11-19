// TMAPI (1688 data) gateway. The API key never leaves the server.
//
// POST /functions/v1/tmapi
//   { "action": "search", "keyword": "wig", "page": 1 }
//   { "action": "import", "item_id": 652702302959, "category": "hair" }   // or "url": "https://detail.1688.com/offer/….html"
//   { "action": "check_images", "item_id": 652702302959, "mirror": true }
//
// Auth: a staff JWT (super_admin, purchasing, marketing) or the x-task-token header
// (scheduled jobs, value in public.internal_tokens). verify_jwt is off because we check here.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const TMAPI_KEY = Deno.env.get("TMAPI_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HOSTS = ["https://api.tmapi.top", "http://api.tmapi.top"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { "Content-Type": "application/json" } });

async function authorised(req: Request, db: SupabaseClient): Promise<boolean> {
  const task = req.headers.get("x-task-token");
  if (task) {
    const { data } = await db.from("internal_tokens").select("token").eq("name", "tasks").single();
    return !!data && data.token === task;
  }
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return false;
  const { data: u } = await db.auth.getUser(jwt);
  if (!u?.user) return false;
  const { data: p } = await db.from("profiles").select("role").eq("id", u.user.id).single();
  return ["super_admin", "purchasing", "marketing"].includes(p?.role ?? "");
}

let workingHost: string | null = null;

async function tmapi(db: SupabaseClient, path: string, params: Record<string, string | number>, body?: unknown) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const hosts = workingHost ? [workingHost] : HOSTS;
  let lastErr = "";
  for (const host of hosts) {
    const started = Date.now();
    try {
      const res = await fetch(`${host}${path}${qs ? `?${qs}` : ""}`, {
        method: body ? "POST" : "GET",
        headers: { apikey: TMAPI_KEY, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(25_000),
      });
      const text = await res.text();
      let data: { code?: number; msg?: string; message?: string; data?: unknown } = {};
      try { data = JSON.parse(text); } catch { data = { msg: text.slice(0, 300) }; }
      if (!data.msg) data.msg = data.message ?? (data.code === 200 ? "success" : text.slice(0, 300));
      await db.from("api_calls").insert({
        endpoint: path, params: { ...params, host }, http_status: res.status, api_code: data.code ?? null,
        message: data.msg ?? null, duration_ms: Date.now() - started,
      });
      workingHost = host;
      return { ok: res.ok && data.code === 200, status: res.status, host, ...data };
    } catch (e) {
      lastErr = `${host}: ${(e as Error).message}`;
    }
  }
  return { ok: false, status: 0, host: null, code: null, msg: lastErr, data: null };
}

// ---- Mapping helpers ----------------------------------------------------------------
type Detail = Record<string, any>;

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 60).replace(/-$/, "");
const https = (u?: string | null) => (u ? u.replace(/^\/\//, "https://").replace(/^http:\/\//, "https://") : null);

function parseProps(propsNames?: string) {
  const out: Record<string, string> = {};
  for (const part of (propsNames ?? "").split(";")) {
    const [k, ...v] = part.split(":");
    if (k && v.length) out[k.trim()] = v.join(":").trim();
  }
  return out;
}

function skuImage(d: Detail, propsIds?: string) {
  if (!propsIds) return null;
  for (const pair of propsIds.split(";")) {
    const [pid, vid] = pair.split(":");
    const prop = (d.sku_props ?? []).find((p: any) => String(p.pid) === pid);
    const val = prop?.values?.find((v: any) => String(v.vid) === vid);
    if (val?.imageUrl) return https(val.imageUrl);
  }
  return null;
}

async function importItem(db: SupabaseClient, d: Detail, category?: string) {
  let categoryId: number | null = null;
  if (category) {
    const { data } = await db.from("categories").select("id").eq("slug", category).single();
    categoryId = data?.id ?? null;
  }
  const itemId = Number(d.item_id);
  const title = String(d.title ?? `1688 item ${itemId}`);
  const product = {
    source: "1688",
    source_item_id: itemId,
    source_url: d.product_url ?? `https://detail.1688.com/offer/${itemId}.html`,
    slug: `${slugify(title) || "item"}-${itemId}`,
    title,
    category_id: categoryId,
    main_images: (d.main_imgs ?? []).map(https).filter(Boolean),
    video_url: https(d.video_url),
    props: d.product_props ?? [],
    sale_count: Math.round(num(d.sale_count) ?? 0),
    supplier: d.shop_info ?? {},
    location: d.delivery_info?.location ?? null,
    weight_kg: (num(d.delivery_info?.unit_weight) ?? 0) > 0 ? num(d.delivery_info?.unit_weight) : null,
    cny_min: num(d.price_info?.price_min ?? d.price_info?.price),
    cny_max: num(d.price_info?.price_max ?? d.price_info?.price),
    tiered_prices: d.tiered_price_info?.prices ?? [],
    mixed_batch: d.mixed_batch ?? {},
    raw: d,
    synced_at: new Date().toISOString(),
  };
  const { data: saved, error } = await db.from("products").upsert(product, { onConflict: "source,source_item_id" }).select("id, slug").single();
  if (error) throw new Error(`products: ${error.message}`);

  const skus = (d.skus?.length ? d.skus : [{ skuid: "default", sale_price: d.price_info?.price, stock: d.stock }]).map((s: any) => ({
    product_id: saved.id,
    source_sku_id: String(s.skuid),
    source_spec_id: s.specid ? String(s.specid) : null,
    props: parseProps(s.props_names),
    props_text: s.props_names ?? null,
    image_url: skuImage(d, s.props_ids),
    stock: Math.round(num(s.stock) ?? 0),
    cny_price: num(s.sale_price) ?? num(d.price_info?.price) ?? 0,
    weight_kg: (num(s.package_info?.weight) ?? 0) > 0 ? num(s.package_info?.weight) : null,
  }));
  const { error: skuErr } = await db.from("product_skus").upsert(skus, { onConflict: "product_id,source_sku_id" });
  if (skuErr) throw new Error(`product_skus: ${skuErr.message}`);

  const { data: priced } = await db.from("product_skus").select("props_text, cny_price, weight_kg, stock, price_list, price_midnight, price_retailer").eq("product_id", saved.id).limit(5);
  return { product_id: saved.id, slug: saved.slug, sku_count: skus.length, sample_prices: priced };
}

// ---- Image checks ---------------------------------------------------------------
async function probeImage(url: string, referer?: string) {
  const started = Date.now();
  try {
    const res = await fetch(url, { headers: referer ? { Referer: referer } : {}, redirect: "follow", signal: AbortSignal.timeout(15_000) });
    const buf = new Uint8Array(await res.arrayBuffer());
    return { status: res.status, type: res.headers.get("content-type"), bytes: buf.byteLength, ms: Date.now() - started, ok: res.ok && (res.headers.get("content-type") ?? "").startsWith("image/"), buf };
  } catch (e) {
    return { status: 0, type: null, bytes: 0, ms: Date.now() - started, ok: false, error: (e as Error).message, buf: null };
  }
}

async function checkImages(db: SupabaseClient, d: Detail, mirror: boolean) {
  const urls: string[] = [
    ...(d.main_imgs ?? []).map(https),
    ...(d.sku_props ?? []).flatMap((p: any) => (p.values ?? []).map((v: any) => https(v.imageUrl))),
  ].filter(Boolean).slice(0, 6) as string[];
  const results = [];
  for (const [i, url] of urls.entries()) {
    const plain = await probeImage(url);
    const ours = await probeImage(url, "https://fastchina.shop/");
    let mirrored: string | null = null;
    if (mirror && i === 0 && plain.ok && plain.buf) {
      const ext = (plain.type ?? "image/jpeg").split("/")[1].replace("jpeg", "jpg");
      const path = `1688/${d.item_id}/main-0.${ext}`;
      const { error } = await db.storage.from("product-images").upload(path, plain.buf, { contentType: plain.type ?? "image/jpeg", upsert: true, cacheControl: "31536000" });
      mirrored = error ? `upload failed: ${error.message}` : db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    results.push({
      url,
      no_referer: { status: plain.status, type: plain.type, kb: Math.round(plain.bytes / 1024), ms: plain.ms, ok: plain.ok },
      with_fastchina_referer: { status: ours.status, type: ours.type, kb: Math.round(ours.bytes / 1024), ok: ours.ok },
      ...(mirrored ? { mirrored_to: mirrored } : {}),
    });
  }
  return { images_found: { main: (d.main_imgs ?? []).length, sku_option_images: (d.sku_props ?? []).flatMap((p: any) => p.values ?? []).filter((v: any) => v.imageUrl).length, video: !!d.video_url }, checked: results };
}

// ---- Handler ----------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  if (!(await authorised(req, db))) return json({ error: "Not allowed" }, 401);
  if (!TMAPI_KEY) return json({ error: "TMAPI_KEY secret is not set" }, 500);

  let input: Record<string, any> = {};
  try { input = await req.json(); } catch { /* empty body */ }
  const language = input.language ?? "en";

  try {
    if (input.action === "search") {
      const r = await tmapi(db, "/1688/global/search/items", { keyword: input.keyword ?? "wig", page: input.page ?? 1, page_size: 10, language });
      const items = ((r.data as any)?.items ?? []).map((it: any) => ({ item_id: it.item_id, title: it.title, img: it.img, price: it.price, currency: it.currency, sold_90d: it.sale_info?.sale_quantity_90days }));
      return json({ ok: r.ok, host: r.host, code: r.code, msg: r.msg, count: items.length, items });
    }

    if (input.action === "probe_images") {
      // Staff check that 1688 image URLs load and can be copied into our storage. Alibaba image hosts only.
      const urls: string[] = (input.urls ?? []).slice(0, 6);
      if (!urls.every((u) => /^https:\/\/[a-z0-9-]+\.alicdn\.com\//i.test(u))) return json({ error: "Only https://*.alicdn.com image URLs" }, 400);
      return json({ ok: true, ...(await checkImages(db, { item_id: "probe", main_imgs: urls }, !!input.mirror)) });
    }

    const detail = input.url
      ? await tmapi(db, "/1688/item_detail_by_url", {}, { url: input.url, language })
      : await tmapi(db, "/1688/item_detail", { item_id: input.item_id, language });
    if (!detail.ok) return json({ ok: false, host: detail.host, status: detail.status, code: detail.code, msg: detail.msg }, 502);
    const d = detail.data as Detail;

    if (input.action === "check_images") {
      return json({ ok: true, host: detail.host, item_id: d.item_id, title: d.title, ...(await checkImages(db, d, !!input.mirror)) });
    }
    if (input.action === "import") {
      return json({ ok: true, host: detail.host, ...(await importItem(db, d, input.category)) });
    }
    return json({ error: "Unknown action. Use search, import, check_images or probe_images." }, 400);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
