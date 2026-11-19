"use client";

import { useSyncExternalStore } from "react";

/**
 * The customer's primary pickup station on this device. Signed-in customers also keep it on
 * their profile (set_my_station); this copy makes checkout and delivery dates instant, even offline.
 */
const KEY = "fc-station";
const WELCOME = "fc-welcome-done";
const PENDING = "fc-pending-station";
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode or storage full: the choice still applies for this visit.
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export const getStationId = () => read(KEY);
export const setStationId = (id: string | null) => write(KEY, id);
export function useStationId(): string | null {
  return useSyncExternalStore(subscribe, getStationId, () => null);
}

export const welcomeDone = () => read(WELCOME) !== null;
export const markWelcomeDone = () => write(WELCOME, new Date().toISOString());

export interface PendingStation { state: string; area: string; name: string; address: string; lat?: number; lng?: number }
export function getPendingStation(): PendingStation | null {
  const raw = read(PENDING);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingStation;
  } catch {
    return null;
  }
}
export const setPendingStation = (p: PendingStation | null) => write(PENDING, p ? JSON.stringify(p) : null);
