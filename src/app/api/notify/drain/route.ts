import { timingSafeEqual } from "node:crypto";
import { drainOutbox } from "@/lib/email/send";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

/**
 * Sends queued emails. Called by the database every minute (pg_cron → pg_net) with the
 * internal task token. Safe to call often: rows are claimed with row locks, sends are idempotent.
 */
export async function POST(request: Request) {
  if (!hasSupabase || !process.env.RESEND_API_KEY) return Response.json({ error: "Email isn't configured" }, { status: 503 });
  const given = request.headers.get("x-task-token") ?? "";
  const { data } = await secretDb().from("internal_tokens").select("token").eq("name", "tasks").maybeSingle();
  const expected = data?.token ?? "";
  if (!expected || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json(await drainOutbox());
}
