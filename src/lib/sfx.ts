"use client";

/**
 * Tiny sound-effect engine built on the Web Audio API (no audio files to ship).
 * Browsers only allow audio after a user gesture — every sound is triggered from a tap.
 */
const MUTE_KEY = "quizkids:muted";

let ctx: AudioContext | null = null;
let muted = false;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Note = { f: number; t: number; d: number; type?: OscillatorType; v?: number };

function play(notes: Note[]) {
  load();
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.value = n.f;
    const start = now + n.t;
    const peak = n.v ?? 0.25;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + n.d + 0.05);
  }
}

export const sfx = {
  correct: () =>
    play([
      { f: 659, t: 0, d: 0.15 },
      { f: 880, t: 0.12, d: 0.25 },
    ]),
  wrong: () =>
    play([
      { f: 220, t: 0, d: 0.2, type: "sawtooth", v: 0.12 },
      { f: 165, t: 0.15, d: 0.3, type: "sawtooth", v: 0.12 },
    ]),
  tap: () => play([{ f: 520, t: 0, d: 0.06, type: "triangle", v: 0.15 }]),
  star: (i = 0) => play([{ f: 660 + i * 220, t: 0, d: 0.3, type: "triangle", v: 0.22 }]),
  win: () =>
    play([
      { f: 523, t: 0, d: 0.18 },
      { f: 659, t: 0.15, d: 0.18 },
      { f: 784, t: 0.3, d: 0.18 },
      { f: 1047, t: 0.45, d: 0.45 },
    ]),
  lose: () =>
    play([
      { f: 392, t: 0, d: 0.25, type: "triangle" },
      { f: 330, t: 0.22, d: 0.25, type: "triangle" },
      { f: 262, t: 0.44, d: 0.4, type: "triangle" },
    ]),
};

export function isMuted(): boolean {
  load();
  return muted;
}

export function setMuted(value: boolean) {
  load();
  muted = value;
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeMuted(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
