import Link from "next/link";
import type { ReactNode } from "react";
import type { Block } from "@/lib/content/guides";

/** Turns "[text](/path)" and "**bold**" into links and bold text. Internal links use next/link. */
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      out.push(
        href.startsWith("/") ? (
          <Link key={m.index} href={href} className="font-semibold underline decoration-line underline-offset-4 hover:decoration-ink">{m[1]}</Link>
        ) : (
          <a key={m.index} href={href} className="font-semibold underline decoration-line underline-offset-4 hover:decoration-ink">{m[1]}</a>
        ),
      );
    } else out.push(<strong key={m.index} className="font-bold text-ink">{m[3]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (typeof b === "string") return <p key={i}><Inline text={b} /></p>;
        if ("list" in b)
          return (
            <ul key={i} className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
              {b.list.map((t) => <li key={t}><Inline text={t} /></li>)}
            </ul>
          );
        if ("steps" in b)
          return (
            <ol key={i} className="flex flex-col gap-3">
              {b.steps.map(([t, d], n) => (
                <li key={t} className="flex gap-3.5 rounded-xl border border-line p-4">
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">{n + 1}</span>
                  <span className="flex min-w-0 flex-col gap-1"><strong className="text-ink">{t}</strong><span><Inline text={d} /></span></span>
                </li>
              ))}
            </ol>
          );
        if ("table" in b)
          return (
            <div key={i} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
                <thead>
                  <tr>{b.table.head.map((h, k) => <th key={k} scope="col" className="border-b-2 border-ink px-3 py-2.5 font-bold text-ink">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {b.table.rows.map((r, k) => (
                    <tr key={k} className="border-b border-line">
                      {r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="px-3 py-2.5 font-semibold text-ink"><Inline text={c} /></th> : <td key={j} className="px-3 py-2.5"><Inline text={c} /></td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        return (
          <p key={i} className="rounded-xl border-l-4 border-success bg-success-soft px-4 py-3 text-[#174A35]">
            <strong>Tip: </strong><Inline text={b.tip} />
          </p>
        );
      })}
    </>
  );
}
