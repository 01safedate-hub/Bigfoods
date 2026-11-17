/** Shown whenever a server call can't complete (no signal, server unreachable, timeout). */
export const NETWORK_MESSAGE = "We couldn’t reach FastChina. Check your connection and try again.";

/**
 * Runs a server action and turns network failures into a friendly result instead of an
 * unhandled error. Use for every user-triggered call.
 */
export async function attempt<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; message: string; offline: boolean }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, message: "You’re offline. Reconnect and try again.", offline: true };
  try {
    return { ok: true, value: await fn() };
  } catch {
    return { ok: false, message: NETWORK_MESSAGE, offline: typeof navigator !== "undefined" && !navigator.onLine };
  }
}

/** For actions that already return { ok, message }: a network failure becomes the same shape. */
export async function call<T extends { ok: boolean; message: string }>(fn: () => Promise<T>): Promise<T | { ok: false; message: string }> {
  const r = await attempt(fn);
  return r.ok ? r.value : { ok: false, message: r.message };
}
