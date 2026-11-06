"use client";
import { useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/sfx";

export function useMuted() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  return [muted, setMuted] as const;
}
