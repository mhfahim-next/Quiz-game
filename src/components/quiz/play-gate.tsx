"use client";

import { Lock } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { useProgress } from "@/components/providers/progress-provider";
import { QuizPlayer } from "./quiz-player";
import type { QuizQuestion } from "@/lib/types";

type Props = {
  levelId: string;
  passPercent: number;
  previousLevelId: string | null;
  nextLevelId: string | null;
  categorySlug: string;
  questions: QuizQuestion[];
};

/** Blocks levels that are not unlocked yet (client-side: guests have no server record). */
export function PlayGate(props: Props) {
  const { progress, ready } = useProgress();
  const { levelId, previousLevelId, categorySlug, questions } = props;

  if (!ready) {
    return <div className="grid min-h-[50dvh] place-items-center text-5xl animate-float">⏳</div>;
  }

  const unlocked =
    previousLevelId === null || progress[levelId]?.unlocked === true || (progress[previousLevelId]?.stars ?? 0) > 0;

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Lock className="size-20 text-slate-400" aria-hidden />
        <h1 className="text-2xl font-extrabold">এই লেভেল এখনো বন্ধ</h1>
        <p className="text-lg">আগের লেভেলটি পাস করলে এটি খুলে যাবে।</p>
        <LinkButton href={`/c/${categorySlug}`} size="xl">
          লেভেল ম্যাপে যাও
        </LinkButton>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="text-6xl" aria-hidden>
          🛠️
        </div>
        <h1 className="text-2xl font-extrabold">এই লেভেলে এখনো প্রশ্ন নেই</h1>
        <LinkButton href={`/c/${categorySlug}`} size="xl">
          ফিরে যাও
        </LinkButton>
      </div>
    );
  }

  return <QuizPlayer {...props} />;
}
