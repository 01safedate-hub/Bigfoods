import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Resend webhook (Svix signing): HMAC-SHA256 of "id.timestamp.body" with the
 * base64 secret after "whsec_", compared against every "v1,<sig>" in the header.
 * Rejects anything older than 5 minutes to stop replays.
 */
export function verifyWebhook(secret: string, id: string, timestamp: string, signatureHeader: string, body: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!secret || !id || !timestamp || !signatureHeader) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatureHeader.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
