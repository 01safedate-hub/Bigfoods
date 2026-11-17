import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkStaff } from "@/lib/supabase/auth";

/** Every admin page renders inside this. Staff role is checked on the server for each request. */
export async function StaffGate({ children }: { children: React.ReactNode }) {
  const s = await checkStaff();
  if (!s.ok && s.reason === "signed-out") redirect("/sign-in?next=/admin");
  if (!s.ok) {
    return (
      <div className="m-auto flex max-w-sm flex-col items-center gap-3 rounded-xl bg-white p-6 text-center">
        <ShieldAlert aria-hidden size={32} className="text-sale" />
        <h1 className="text-lg font-extrabold">Staff only</h1>
        <p className="text-[#5B6170]">Your account doesn’t have a staff role. Ask a Super admin to add you under Staff &amp; roles.</p>
        <Link href="/" className="min-h-10 rounded-md bg-ink px-4 py-2.5 font-bold text-white">Back to the shop</Link>
      </div>
    );
  }
  return (
    <>
      <p className={`rounded-md px-3 py-2 text-xs ${s.demo ? "bg-[#FFF7E0] text-gold-ink" : "bg-success-soft text-success"}`}>
        {s.demo ? "Demo mode: the database isn’t connected, so these screens show sample data and nothing is saved." : `Signed in as ${s.user?.email ?? s.user?.phone} · staff`}
      </p>
      {children}
    </>
  );
}
