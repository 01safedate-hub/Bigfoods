import "server-only";
import { secretDb } from "@/lib/supabase/server";
import { renderEmail } from "./render";
import { unsubscribeUrl } from "./unsubscribe";

const FROM = process.env.EMAIL_FROM ?? "FastChina <orders@fastchina.shop>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "help@fastchina.shop";

interface OutboxRow {
  id: string;
  customer_id: string | null;
  to_email: string;
  template: string;
  data: Record<string, unknown>;
  marketing: boolean;
}

/** Sends one email through Resend. The outbox id is the idempotency key, so a retry can never send twice. */
async function sendOne(row: OutboxRow): Promise<{ ok: boolean; id?: string; error?: string; permanent?: boolean }> {
  const unsub = row.marketing && row.customer_id ? unsubscribeUrl(row.customer_id) : undefined;
  let email;
  try {
    email = await renderEmail(row.template, row.data, unsub);
  } catch (e) {
    return { ok: false, error: `Render failed: ${(e as Error).message}`, permanent: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `outbox-${row.id}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [row.to_email],
      reply_to: REPLY_TO,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "template", value: row.template }],
      headers: unsub ? { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
    }),
    signal: AbortSignal.timeout(15_000),
  }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message }) as unknown as Response);
  if (res.ok) {
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: body.id };
  }
  const text = await res.text().catch(() => "");
  // Bad address or rejected content won't get better by retrying.
  return { ok: false, error: `${res.status} ${text}`.slice(0, 500), permanent: res.status === 422 || res.status === 400 };
}

/** Sends everything due in the outbox (up to `limit`). Called every minute by the database scheduler. */
export async function drainOutbox(limit = 25): Promise<{ sent: number; failed: number }> {
  const db = secretDb();
  const { data, error } = await db.rpc("claim_emails", { p_limit: limit });
  if (error) throw new Error(`claim_emails: ${error.message}`);
  let sent = 0;
  let failed = 0;
  for (const row of (data ?? []) as OutboxRow[]) {
    const r = await sendOne(row);
    if (r.ok) sent++;
    else failed++;
    if (!r.ok && r.permanent) {
      await db.from("email_outbox").update({ status: "failed", last_error: r.error }).eq("id", row.id);
    } else {
      await db.rpc("finish_email", { p_id: row.id, p_ok: r.ok, p_provider_id: r.id ?? null, p_error: r.error ?? null });
    }
  }
  return { sent, failed };
}
