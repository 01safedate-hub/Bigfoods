import { verifyWebhook } from "@/lib/email/webhook";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

interface ResendEvent {
  type: string;
  data?: { email_id?: string; to?: string[]; bounce?: { type?: string } };
}

/**
 * Delivery updates from Resend. Hard bounces and spam complaints add the address to our
 * suppression list (never emailed again); complaints also switch off offer emails.
 * Set the endpoint in Resend → Webhooks and put its signing secret in RESEND_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const h = request.headers;
  const ok = verifyWebhook(process.env.RESEND_WEBHOOK_SECRET ?? "", h.get("svix-id") ?? "", h.get("svix-timestamp") ?? "", h.get("svix-signature") ?? "", body);
  if (!ok) return Response.json({ error: "Invalid signature" }, { status: 401 });
  if (!hasSupabase) return Response.json({ ok: true });

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return Response.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { error } = await secretDb().rpc("record_email_event", {
    p_provider_id: event.data?.email_id ?? "",
    p_type: event.type,
    p_email: event.data?.to?.[0] ?? null,
    p_hard: event.data?.bounce?.type === "Permanent",
  });
  // A 5xx makes Resend retry later (e.g. while a database update is still being applied).
  return error ? Response.json({ error: "Not recorded" }, { status: 503 }) : Response.json({ ok: true });
}
