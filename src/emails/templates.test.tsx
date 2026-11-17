import { describe, expect, it } from "vitest";
import { renderEmail } from "@/lib/email/render";
import { TEMPLATES } from "./templates";

describe("email templates", () => {
  for (const [name, t] of Object.entries(TEMPLATES)) {
    it(`${name} renders HTML and text`, async () => {
      const e = await renderEmail(name, t.sample, t.marketing ? "https://fastchina.shop/unsubscribe?u=x&t=y" : undefined);
      expect(e.subject.length).toBeGreaterThan(5);
      expect(e.subject).not.toMatch(/undefined|NaN|#\s/);
      expect(e.html).toContain("FAST");
      expect(e.html).not.toMatch(/undefined|NaN/);
      expect(e.text.length).toBeGreaterThan(40);
      expect(e.html.includes("Unsubscribe")).toBe(Boolean(t.marketing));
    });
  }
  it("money is formatted in naira", async () => {
    const e = await renderEmail("order_placed", TEMPLATES.order_placed.sample);
    expect(e.html).toContain("₦19,736");
    expect(e.html).toContain("₦5,036");
  });
});
