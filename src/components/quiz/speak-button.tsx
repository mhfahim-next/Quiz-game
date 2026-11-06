"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSpeechSupported, speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

/** Speaker button: reads `text` aloud in Bangla (bn-BD) using the Web Speech API. */
export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(isSpeechSupported());
    // voices load asynchronously in some browsers
    if (isSpeechSupported()) window.speechSynthesis.getVoices();
    return () => stopSpeaking();
  }, []);

  // stop reading when the question changes
  useEffect(() => {
    setSpeaking(false);
    return () => stopSpeaking();
  }, [text]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      size="xl"
      variant="secondary"
      className={cn("size-14 shrink-0 rounded-full px-0 text-violet-700", speaking && "animate-pop bg-violet-200", className)}
      aria-label="প্রশ্নটি শোনো"
      onClick={() => {
        setSpeaking(true);
        speak(text, () => setSpeaking(false));
      }}
    >
      <Volume2 />
    </Button>
  );
}
