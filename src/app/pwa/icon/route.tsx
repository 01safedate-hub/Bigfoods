import { ImageResponse } from "next/og";
import { getStore } from "@/lib/data/stores";

/** A seller store's app icon: the store's first letter on its accent colour. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const key = sp.get("s") ?? "";
  const size = [180, 192, 512].includes(Number(sp.get("size"))) ? Number(sp.get("size")) : 192;
  const maskable = sp.get("maskable") === "1";
  const found = /^[a-z0-9.-]{3,80}$/.test(key) ? await getStore(key) : null;
  const name = found?.store.name ?? "Store";
  const accent = found?.store.accent ?? "#111111";
  const letter = (name.match(/[A-Za-z0-9]/)?.[0] ?? "S").toUpperCase();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: accent, borderRadius: maskable ? 0 : size * 0.22, color: "#ffffff", fontSize: size * (maskable ? 0.42 : 0.56), fontWeight: 800 }}>
        {letter}
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
