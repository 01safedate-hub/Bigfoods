import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const SITE = process.env.SITE_URL ?? "https://fastchina.shop";
const secret = () => process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SECRET_KEY ?? "";

const sign = (customerId: string) => createHmac("sha256", secret()).update(`unsubscribe:${customerId}`).digest("base64url").slice(0, 32);

/** Link in every marketing email. Signed, so nobody can unsubscribe someone else. */
export const unsubscribeUrl = (customerId: string) => `${SITE}/unsubscribe?u=${customerId}&t=${sign(customerId)}`;

export function verifyUnsubscribe(customerId: string, token: string): boolean {
  if (!secret() || !/^[0-9a-f-]{36}$/.test(customerId)) return false;
  const a = Buffer.from(sign(customerId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
