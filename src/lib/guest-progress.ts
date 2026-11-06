import type { ProgressMap } from "@/lib/types";

const KEY = "quizkids:progress:v1";

/** Guest progress lives in localStorage. Every access is guarded: storage can be blocked or full. */
export function loadGuestProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveGuestProgress(map: ProgressMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function clearGuestProgress(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
