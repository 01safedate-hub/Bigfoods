import { ImageResponse } from "next/og";
import { OgCard } from "@/components/seo/og-card";
import { GUIDES, guideBySlug } from "@/lib/content/guides";

/** Share card for a guide, at a stable address (/og/guides/<slug>) used by Open Graph and the Article schema. */
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) return new Response("Not found", { status: 404 });
  return new ImageResponse(<OgCard kicker={`Guide · ${g.topic}`} title={g.h1} foot="fastchina.shop/guides" />, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800" },
  });
}
