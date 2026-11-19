import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-2xl font-extrabold tracking-[0.06em]">FASTCHINA</span>
      <h1 className="text-lg font-bold">We couldn’t find that page</h1>
      <p className="max-w-sm text-sm text-muted">It may have sold out or moved. Search for it, or ask us to find it for you.</p>
      <Link href="/search" className="bg-ink px-5 py-3 text-sm font-extrabold text-white">SEARCH FASTCHINA</Link>
    </main>
  );
}
