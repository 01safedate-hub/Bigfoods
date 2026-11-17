import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhook } from "./webhook";

const secret = `whsec_${Buffer.from("super-secret-key-material").toString("base64")}`;
const sign = (id: string, ts: string, body: string) =>
  `v1,${createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest("base64")}`;

describe("Resend webhook signatures", () => {
  const body = JSON.stringify({ type: "email.bounced", data: { email_id: "e1", to: ["a@b.c"], bounce: { type: "Permanent" } } });
  it("accepts a correct, fresh signature (also among several)", () => {
    expect(verifyWebhook(secret, "msg_1", "1000", sign("msg_1", "1000", body), body, 1100)).toBe(true);
    expect(verifyWebhook(secret, "msg_1", "1000", `v1,AAAA ${sign("msg_1", "1000", body)}`, body, 1100)).toBe(true);
  });
  it("rejects tampered bodies, wrong secrets and old messages", () => {
    expect(verifyWebhook(secret, "msg_1", "1000", sign("msg_1", "1000", body), body.replace("Permanent", "Transient"), 1100)).toBe(false);
    expect(verifyWebhook("whsec_d3Jvbmc=", "msg_1", "1000", sign("msg_1", "1000", body), body, 1100)).toBe(false);
    expect(verifyWebhook(secret, "msg_1", "1000", sign("msg_1", "1000", body), body, 2000)).toBe(false);
    expect(verifyWebhook(secret, "msg_1", "1000", "", body, 1100)).toBe(false);
  });
});
