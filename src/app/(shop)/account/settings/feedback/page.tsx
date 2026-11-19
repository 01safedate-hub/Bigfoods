import type { Metadata } from "next";
import { Panel, SettingsShell } from "../ui";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Rating & feedback", robots: { index: false } };

export default function FeedbackPage() {
  return (
    <SettingsShell title="Rating & feedback">
      <Panel>
        <p className="text-[14px] text-muted">How is FastChina working for you? Every message is read by the team.</p>
        <FeedbackForm />
      </Panel>
    </SettingsShell>
  );
}
