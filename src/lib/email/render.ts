import { render } from "@react-email/components";
import { buildEmail, type EmailData } from "@/emails/templates";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  marketing: boolean;
}

/** HTML and plain-text versions of a template (both are sent; some mail apps prefer text). */
export async function renderEmail(template: string, data: EmailData, unsubscribeUrl?: string): Promise<RenderedEmail> {
  const { subject, element, marketing } = buildEmail(template, data, unsubscribeUrl);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject, html, text, marketing };
}
