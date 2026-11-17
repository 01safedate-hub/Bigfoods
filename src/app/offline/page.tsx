import type { Metadata } from "next";

export const metadata: Metadata = { title: "You’re offline", robots: { index: false } };

/** Saved by the service worker and shown when a page can't load without a connection. Self-contained on purpose. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden>
        <rect width="64" height="64" rx="14" fill="#111111" />
        <path d="M36.5 8 15 36h14l-3.5 20L49 27H35z" fill="#F5C542" />
      </svg>
      <h1 className="text-2xl font-extrabold">You’re offline</h1>
      <p className="max-w-xs text-[#555]">This page isn’t saved on your phone yet. Pages you’ve opened before still work, and your cart is safe.</p>
      {/* A full page load on purpose, so the browser retries the network instead of client navigation. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="min-h-11 rounded-md bg-[#111] px-5 py-3 text-sm font-extrabold text-white">TRY AGAIN</a>
    </main>
  );
}
