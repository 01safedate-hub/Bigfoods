/** Minimal sitemap writer with Google's image extension. */
export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
  images?: string[];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function sitemapXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) =>
      [
        "<url>",
        `<loc>${esc(e.url)}</loc>`,
        e.lastModified && `<lastmod>${esc(e.lastModified)}</lastmod>`,
        e.changeFrequency && `<changefreq>${e.changeFrequency}</changefreq>`,
        e.priority !== undefined && `<priority>${e.priority.toFixed(1)}</priority>`,
        ...(e.images ?? []).slice(0, 10).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`),
        "</url>",
      ].filter(Boolean).join(""),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}
