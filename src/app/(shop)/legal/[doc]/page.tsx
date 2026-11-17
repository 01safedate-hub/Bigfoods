import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/content/legal";

export function generateStaticParams() {
  return Object.keys(LEGAL).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const d = LEGAL[(await params).doc];
  return d ? { title: d.title, description: d.summary, alternates: { canonical: `/legal/${(await params).doc}` } } : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
  const { doc } = await params;
  const d = LEGAL[doc];
  if (!d) notFound();
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 text-[14px] leading-relaxed">
      <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {Object.entries(LEGAL).map(([k, v]) => (
          <Link key={k} href={`/legal/${k}`} aria-current={k === doc ? "page" : undefined} className={k === doc ? "font-bold" : "text-muted underline"}>{v.title}</Link>
        ))}
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">{d.title}</h1>
        <p className="text-muted">{d.summary} Last updated 17 November 2026.</p>
      </header>
      {d.sections.map((s) => (
        <section key={s.h} className="flex flex-col gap-2">
          <h2 className="text-base font-extrabold">{s.h}</h2>
          {s.p.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      ))}
    </article>
  );
}
