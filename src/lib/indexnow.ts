import "server-only";

/**
 * IndexNow: tells Bing, Yandex, Seznam and Naver about new or changed pages straight away
 * (Google reads the sitemap instead). Set INDEXNOW_KEY (8–128 letters, digits or dashes);
 * the key is served at /indexnow.txt so the engines can check we own the site.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !urls.length) return;
  const host = new URL(urls[0]).host;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/indexnow.txt`, urlList: urls.slice(0, 10_000) }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Best effort: the sitemap still covers it.
  }
}
