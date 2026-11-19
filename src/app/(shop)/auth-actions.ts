"use server";

import { allow, TOO_MANY } from "@/lib/rate-limit";
import { getSessionUser, userDb } from "@/lib/supabase/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/** Nigerian numbers to E.164: 0803… → +234803… */
function normalisePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const e = d.startsWith("234") ? d : d.startsWith("0") ? `234${d.slice(1)}` : d.length === 10 ? `234${d}` : d;
  return /^234[789][01]\d{8}$/.test(e) ? `+${e}` : null;
}

function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters for your password.";
  if (pw.length > 72) return "That password is too long.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Use letters and at least one number.";
  return null;
}

/** Emails listed in SUPER_ADMIN_EMAILS become Super admins when they sign up. */
const adminEmails = () => (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/**
 * Creates an account that can sign in straight away (no email verification step), then signs it in.
 * The account is created on the server with the secret key, so it is confirmed whatever the
 * Supabase "Confirm email" setting is.
 */
export async function signUp(input: { name?: unknown; email?: unknown; password?: unknown; phone?: unknown; stationId?: unknown }): Promise<Result> {
  if (!hasSupabase) return { ok: false, message: "Accounts turn on when the database is connected." };
  if (!(await allow("signup", 5, 3600))) return { ok: false, message: TOO_MANY };
  const name = clean(input.name, 80);
  const email = clean(input.email, 200).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  if (name.length < 2) return { ok: false, message: "Enter your name." };
  if (!EMAIL.test(email)) return { ok: false, message: "Enter a valid email address." };
  const pw = passwordProblem(password);
  if (pw) return { ok: false, message: pw };
  const rawPhone = clean(input.phone, 30);
  const phone = rawPhone ? normalisePhone(rawPhone) : null;
  if (rawPhone && !phone) return { ok: false, message: "Enter a Nigerian phone number, e.g. 0803 000 0000." };

  const admin = secretDb();
  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (error || !created.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return { ok: false, message: taken ? "There’s already an account with this email. Sign in instead." : "We couldn’t create your account. Please try again." };
  }
  const id = created.user.id;
  const stationId = typeof input.stationId === "string" && input.stationId.length < 40 ? input.stationId : null;
  const patch: Record<string, unknown> = { full_name: name, phone };
  if (adminEmails().includes(email)) patch.role = "super_admin";
  await admin.from("profiles").update(patch).eq("id", id);
  if (stationId) {
    const { data: ok } = await admin.from("pickup_stations").select("id").eq("id", stationId).eq("active", true).eq("verified", true).maybeSingle();
    if (ok) await admin.from("profiles").update({ station_id: stationId }).eq("id", id);
  }

  const { error: signInError } = await (await userDb()).auth.signInWithPassword({ email, password });
  if (signInError) return { ok: false, message: "Account created. Please sign in." };
  return { ok: true };
}

export async function signIn(input: { email?: unknown; password?: unknown }): Promise<Result> {
  if (!hasSupabase) return { ok: false, message: "Sign-in turns on when the database is connected." };
  const email = clean(input.email, 200).toLowerCase();
  if (!(await allow("signin", 10, 900)) || !(await allow("signin-acct", 8, 900, email))) return { ok: false, message: TOO_MANY };
  const password = typeof input.password === "string" ? input.password : "";
  if (!EMAIL.test(email) || !password) return { ok: false, message: "Enter your email and password." };
  const { error } = await (await userDb()).auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: /confirm/i.test(error.message) ? "Please confirm your email first." : "Email or password is wrong." };
  return { ok: true };
}

/** Change password while signed in (also used after signing in with an email code). */
export async function changePassword(password: unknown): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in first." };
  const pw = typeof password === "string" ? password : "";
  const problem = passwordProblem(pw);
  if (problem) return { ok: false, message: problem };
  const { error } = await secretDb().auth.admin.updateUserById(user.id, { password: pw });
  return error ? { ok: false, message: "Couldn’t change your password. Try again." } : { ok: true };
}

export interface MyProfile {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  role: string;
  stationId: string | null;
  station: { id: string; name: string; area: string; state: string; verified: boolean } | null;
}

export async function myProfile(): Promise<MyProfile | null> {
  if (!hasSupabase) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const db = await userDb();
  const { data } = await db.from("profiles").select("full_name, phone, role, station_id").eq("id", user.id).maybeSingle();
  let station: MyProfile["station"] = null;
  if (data?.station_id) {
    const { data: s } = await db.from("pickup_stations").select("id, name, area, state, verified").eq("id", data.station_id).maybeSingle();
    station = s ?? null;
  }
  return {
    id: user.id,
    email: user.email,
    name: data?.full_name || user.email?.split("@")[0] || "FastChina customer",
    phone: data?.phone ?? user.phone,
    role: data?.role ?? "customer",
    stationId: data?.station_id ?? null,
    station,
  };
}

export async function updateProfile(input: { name?: unknown; phone?: unknown }): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in first." };
  const name = clean(input.name, 80);
  if (name.length < 2) return { ok: false, message: "Enter your name." };
  const raw = clean(input.phone, 30);
  const phone = raw ? normalisePhone(raw) : null;
  if (raw && !phone) return { ok: false, message: "Enter a Nigerian phone number, e.g. 0803 000 0000." };
  const { error } = await secretDb().from("profiles").update({ full_name: name, phone }).eq("id", user.id);
  return error ? { ok: false, message: "Couldn’t save. Try again." } : { ok: true };
}

/** Saves the primary pickup station for a signed-in customer. Guests keep it on the device. */
export async function setMyStation(stationId: unknown): Promise<Result> {
  if (typeof stationId !== "string" || stationId.length > 40) return { ok: false, message: "Unknown station." };
  if (!(await getSessionUser())) return { ok: false, message: "guest" };
  const { error } = await (await userDb()).rpc("set_my_station", { p_station: stationId });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function addMyStation(input: { state?: unknown; area?: unknown; name?: unknown; address?: unknown; lat?: unknown; lng?: unknown }): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!(await getSessionUser())) return { ok: false, message: "Create an account or sign in to add your own station." };
  if (!(await allow("add-station", 5, 3600))) return { ok: false, message: TOO_MANY };
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const { data, error } = await (await userDb()).rpc("add_my_station", {
    p_state: clean(input.state, 40), p_area: clean(input.area, 60), p_name: clean(input.name, 120), p_address: clean(input.address, 300),
    p_lat: num(input.lat), p_lng: num(input.lng),
  });
  return error ? { ok: false, message: error.message } : { ok: true, id: data as string };
}

export async function sendFeedback(input: { rating?: unknown; message?: unknown; page?: unknown }): Promise<Result> {
  if (!hasSupabase) return { ok: true };
  if (!(await allow("feedback", 5, 3600))) return { ok: false, message: TOO_MANY };
  const rating = typeof input.rating === "number" && input.rating >= 1 && input.rating <= 5 ? Math.round(input.rating) : null;
  const message = clean(input.message, 2000);
  if (!rating && message.length < 3) return { ok: false, message: "Pick a rating or write a message." };
  const user = await getSessionUser();
  const { error } = await secretDb().from("feedback").insert({ customer_id: user?.id ?? null, rating, message: message || null, page: clean(input.page, 100) || null });
  return error ? { ok: false, message: "Couldn’t send. Try again." } : { ok: true };
}
