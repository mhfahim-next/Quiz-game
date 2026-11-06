"use client";

/** Web Speech API helpers (text-to-speech in Bangla, bn-BD). */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function pickBanglaVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "bn-bd") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("bn")) ??
    undefined
  );
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "bn-BD";
  const voice = pickBanglaVoice();
  if (voice) utter.voice = voice;
  utter.rate = 0.85; // a little slower for young listeners
  utter.pitch = 1.1;
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  synth.speak(utter);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
