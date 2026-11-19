import type { Metadata } from "next";
import Link from "next/link";
import { checkStaff } from "@/lib/supabase/auth";
import { secretDb } from "@/lib/supabase/server";
import { FLOW, GUIDES } from "./guides";

export const metadata: Metadata = { title: "Guide" };

/** Every role’s guide on one page; the reader’s own role comes first. */
export default async function GuidePage() {
  const s = await checkStaff();
  let role: string | null = null;
  if (s.ok && !s.demo && s.user) role = (await secretDb().from("profiles").select("role").eq("id", s.user.id).maybeSingle()).data?.role ?? null;
  const guides = [...GUIDES].sort((a, b) => Number(b.role === role) - Number(a.role === role));

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Guide</h1>
        <p className="text-[#5B6170]">How FastChina runs, step by step. Read your role first; it takes two minutes.</p>
      </div>

      <section className="flex flex-col gap-2 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
        <strong>The whole flow</strong>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {FLOW.map((f) => (
            <li key={f.n} className="flex gap-2.5 rounded-md bg-[#F4F5F7] p-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{f.n}</span>
              <span><strong className="block">{f.t}</strong><span className="text-xs text-[#5B6170]">{f.d}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="Roles" className="flex flex-wrap gap-1.5">
        {guides.map((g) => (
          <a key={g.role} href={`#${g.role}`} className="rounded-full border border-[#D0D4DB] bg-white px-3 py-1.5 text-xs font-semibold">
            {g.title}{g.role === role && " · you"}
          </a>
        ))}
      </nav>

      {guides.map((g) => (
        <section key={g.role} id={g.role} className="flex scroll-mt-4 flex-col gap-3 rounded-lg border border-[#E3E5EA] bg-white p-3.5">
          <div>
            <h2 className="text-lg font-extrabold">{g.title}{g.role === role && <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 align-middle text-xs text-success">Your role</span>}</h2>
            <p className="text-[#5B6170]">{g.job}</p>
          </div>
          <ol className="flex flex-col gap-2">
            {g.steps.map((st, i) => (
              <li key={st.do} className="flex gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ink text-xs font-bold">{i + 1}</span>
                <span>
                  {st.href ? <Link href={st.href} className="font-semibold underline">{st.do}</Link> : <strong className="font-semibold">{st.do}</strong>}
                  <span className="block text-[13px] text-[#5B6170]">{st.how}</span>
                </span>
              </li>
            ))}
          </ol>
          {g.tips.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-md bg-[#FFF7E0] p-2.5 text-[13px]">
              {g.tips.map((t) => <li key={t}>💡 {t}</li>)}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
