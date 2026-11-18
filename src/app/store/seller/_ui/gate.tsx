import Link from "next/link";
import type { SellerState } from "@/lib/data/seller";
import { Onboarding } from "./onboarding";
import { btn } from "./ui";

/** What to show when there's no store to manage yet. Returns null when the page can render. */
export function Gate({ state }: { state: SellerState }) {
  if (state.kind === "signed-out") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Your store, your prices.</h1>
        <p className="text-[#A1A1AA]">Sign in to open your FastChina store or manage it. We handle buying, shipping and delivery; you keep your markup.</p>
        <Link href="/sign-in?next=/store/seller" className={btn.primary}>Sign in to continue</Link>
      </div>
    );
  }
  if (state.kind === "no-store") return <Onboarding />;
  return null;
}

export const DemoNote = ({ demo }: { demo: boolean }) =>
  demo ? <p className="rounded-lg bg-[#2B2410] px-3 py-2 text-[13px] text-[#F5C542]">Demo store: connect the database to manage a real one. Nothing here is saved.</p> : null;
