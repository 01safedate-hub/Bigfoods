import { verifyUnsubscribe } from "@/lib/email/unsubscribe";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

/** One-click unsubscribe (RFC 8058): mail apps POST here from the List-Unsubscribe header, and so does our page. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribe(u, t)) return Response.json({ error: "Invalid link" }, { status: 400 });
  if (hasSupabase) {
    await secretDb().from("notification_prefs").upsert({ customer_id: u, marketing_email: false, updated_at: new Date().toISOString() });
  }
  return Response.json({ ok: true });
}
