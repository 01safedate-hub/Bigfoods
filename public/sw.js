/* FastChina service worker. Keeps public pages, app files and product photos for offline browsing.
   Never caches account, admin, checkout, API calls or anything personal. */
const VERSION = "fc-v1";
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const IMAGES = `${VERSION}-images`;
const OFFLINE_URL = "/offline";
const PUBLIC_PAGE = /^\/($|deals|categories|search|legal\/|product\/)/;
const PRIVATE = /^\/(admin|account|checkout|cart|track|sign-in|notifications|wishlist|c\/|api\/|unsubscribe)/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll([OFFLINE_URL, "/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.get("RSC") || url.searchParams.has("_rsc") || req.headers.get("Next-Router-Prefetch")) return;

  // App files are versioned by Next.js: cache forever.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.open(ASSETS).then(async (c) => (await c.match(req)) || fetch(req).then((res) => (res.ok && c.put(req, res.clone()), res))));
    return;
  }

  // Product photos: show the saved copy straight away, refresh it in the background.
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.open(IMAGES).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone()).then(() => trim(IMAGES, 300));
          return res;
        }).catch(() => hit);
        return hit || net;
      }),
    );
    return;
  }

  // Pages: always try the network first so prices are current; fall back to a saved public page or the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && PUBLIC_PAGE.test(url.pathname) && !PRIVATE.test(url.pathname)) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy)).then(() => trim(PAGES, 60));
          }
          return res;
        })
        .catch(async () => (await caches.match(req, { cacheName: PAGES })) || (await caches.match(OFFLINE_URL)) || Response.error()),
    );
  }
});
