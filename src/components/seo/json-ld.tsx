import { ldJson } from "@/lib/seo";

/** Structured data for search engines. Server-rendered so crawlers see it without JavaScript. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />;
}
