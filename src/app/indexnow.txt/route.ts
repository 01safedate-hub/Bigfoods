/** IndexNow ownership key (see src/lib/indexnow.ts). */
export function GET() {
  const key = process.env.INDEXNOW_KEY;
  return key ? new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } }) : new Response("Not found", { status: 404 });
}
