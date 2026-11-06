"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/components/providers/progress-provider";
import { AnswerButton, type AnswerState } from "./answer-button";
import { QuestionCard } from "./question-card";
import { ResultScreen } from "./result-screen";
import { calcStars, isPassed, percentOf } from "@/lib/scoring";
import { sfx } from "@/lib/sfx";
import { stopSpeaking } from "@/lib/speech";
import type { EarnedBadge, QuizQuestion, ServerAttemptResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  levelId: string;
  passPercent: number;
  questions: QuizQuestion[];
  nextLevelId: string | null;
  categorySlug: string;
};

type Finished = { score: number; total: number; percent: number; stars: 0 | 1 | 2 | 3; passed: boolean };

export function QuizPlayer({ levelId, passPercent, questions, nextLevelId, categorySlug }: Props) {
  const router = useRouter();
  const { recordAttempt, user } = useProgress();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ question_id: string; selected: number }[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [serverResult, setServerResult] = useState<ServerAttemptResult | null>(null);
  const submitted = useRef(false);

  const question = questions[index];
  const total = questions.length;
  const answered = picked !== null;
  const isLast = index === total - 1;

  useEffect(() => () => stopSpeaking(), []);

  const pick = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      // submit the ORIGINAL option index (the server doesn't know our shuffle)
      setAnswers((a) => [...a, { question_id: question.id, selected: question.order[i] }]);
      if (i === question.correct_index) {
        setScore((n) => n + 1);
        sfx.correct();
      } else sfx.wrong();
    },
    [picked, question],
  );

  const next = useCallback(() => {
    stopSpeaking();
    sfx.tap();
    if (!isLast) {
      setIndex((n) => n + 1);
      setPicked(null);
      return;
    }
    // finished: score locally for an instant result, grade on the server in the background
    const percent = percentOf(score, total);
    setFinished({ score, total, percent, stars: calcStars(percent, passPercent), passed: isPassed(percent, passPercent) });
    if (!submitted.current) {
      submitted.current = true;
      void recordAttempt({ levelId, passPercent, score, total, answers }).then(setServerResult);
    }
  }, [isLast, answers, score, total, passPercent, recordAttempt, levelId]);

  if (finished) {
    const badges: EarnedBadge[] = serverResult?.new_badges ?? [];
    return (
      <ResultScreen
        {...finished}
        passPercent={passPercent}
        nextLevelHref={nextLevelId ? `/play/${nextLevelId}` : null}
        mapHref={`/c/${categorySlug}`}
        newBadges={badges}
        isGuest={!user}
        onReplay={() => router.replace(`/play/${levelId}?r=${Date.now()}`)}
      />
    );
  }

  const stateFor = (i: number): AnswerState => {
    if (!answered) return "idle";
    if (i === question.correct_index) return "correct";
    if (i === picked) return "wrong";
    return "dimmed";
  };

  const wasCorrect = answered && picked === question.correct_index;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Progress value={(index / total) * 100} className="h-4 flex-1 [&>div]:bg-green-500" aria-label="অগ্রগতি" />
        <span aria-hidden className="text-2xl">
          🏁
        </span>
      </div>

      {/* key = restart entrance animation for each question */}
      <div key={question.id} className="animate-slide-up flex flex-col gap-4">
        <QuestionCard number={index + 1} total={total} text={question.text} imageUrl={question.image_url} />

        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="উত্তরের বিকল্প">
          {question.options.map((opt, i) => (
            <AnswerButton key={i} index={i} label={opt} state={stateFor(i)} disabled={answered} onSelect={pick} />
          ))}
        </div>
      </div>

      <div aria-live="polite" className="min-h-28">
        {answered && (
          <div
            className={cn(
              "animate-slide-up rounded-3xl p-4 text-lg font-bold",
              wasCorrect ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900",
            )}
          >
            <p className="text-2xl">{wasCorrect ? "🎉 ঠিক উত্তর!" : "😅 ভুল হয়েছে!"}</p>
            {!wasCorrect && (
              <p className="mt-1">
                সঠিক উত্তর: <span className="underline">{question.options[question.correct_index]}</span>
              </p>
            )}
            {question.explanation && <p className="mt-1 text-base font-medium opacity-90">{question.explanation}</p>}
          </div>
        )}
      </div>

      {answered && (
        <Button size="xl" className="h-16 text-xl" onClick={next}>
          {isLast ? (
            <>
              ফলাফল দেখো <Flag />
            </>
          ) : (
            <>
              পরের প্রশ্ন <ArrowRight />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
