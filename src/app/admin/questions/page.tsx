import type { Metadata } from "next";
import { getPendingQuestions, type PendingQuestion } from "@/lib/data/admin";
import { checkStaff } from "@/lib/supabase/auth";
import { QuestionsView } from "./questions-view";

export const metadata: Metadata = { title: "Q&A inbox" };

const SAMPLE: PendingQuestion[] = [
  { id: "s1", question: "Is the satin see-through?", asker: "Customer", askedAt: new Date(Date.UTC(2026, 10, 17, 2)).toISOString(), product: "Satin cowl-neck midi dress", slug: "satin-cowl-neck-midi-dress" },
  { id: "s2", question: "Does the drone need a licence in Nigeria?", asker: "Emeka", askedAt: new Date(Date.UTC(2026, 10, 16, 20)).toISOString(), product: "Foldable 4K camera drone", slug: "foldable-4k-camera-drone" },
  { id: "s3", question: "Can the chair hold 120 kg?", asker: "Customer", askedAt: new Date(Date.UTC(2026, 10, 16, 15)).toISOString(), product: "Ergonomic mesh office chair", slug: "ergonomic-mesh-office-chair" },
];

export default async function QuestionsPage() {
  const s = await checkStaff();
  const live = s.ok && !s.demo ? await getPendingQuestions() : null;
  return <QuestionsView questions={live ?? SAMPLE} />;
}
