"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { ArrowRight, Map, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { StarRating } from "./star-rating";
import { toBanglaNumber } from "@/lib/bangla";
import { sfx } from "@/lib/sfx";
import type { Stars } from "@/lib/scoring";
import type { EarnedBadge } from "@/lib/types";

type Props = {
  score: number;
  total: number;
  percent: number;
  stars: Stars;
  passed: boolean;
  passPercent: number;
  /** null when there is no further level (or it is not published) */
  nextLevelHref: string | null;
  mapHref: string;
  newBadges: EarnedBadge[];
  isGuest: boolean;
  onReplay: () => void;
};

export function ResultScreen({
  score,
  total,
  percent,
  stars,
  passed,
  passPercent,
  nextLevelHref,
  mapHref,
  newBadges,
  isGuest,
  onReplay,
}: Props) {
  useEffect(() => {
    if (passed) {
      sfx.win();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
      }
      for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 400 + i * 350);
    } else {
      sfx.lose();
    }
  }, [passed, stars]);

  return (
    <div className="animate-slide-up flex flex-col items-center gap-5 text-center">
      <div className="text-7xl" aria-hidden>
        {passed ? (stars === 3 ? "🏆" : "🎉") : "💪"}
      </div>
      <h1 className="text-3xl font-extrabold text-violet-700">
        {passed ? (stars === 3 ? "দারুণ! সবকিছু জানো!" : "শাবাশ! পাস করেছ!") : "আরেকটু চেষ্টা করো!"}
      </h1>

      <StarRating value={stars} size="xl" animate />

      <div className="w-full rounded-3xl bg-white p-5 shadow-md">
        <p className="text-5xl font-extrabold text-slate-800">
          {toBanglaNumber(score)} <span className="text-3xl text-slate-400">/ {toBanglaNumber(total)}</span>
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-500">স্কোর {toBanglaNumber(percent)}%</p>
        {!passed && (
          <p className="mt-2 text-base font-semibold text-orange-600">
            পরের লেভেল খুলতে কমপক্ষে {toBanglaNumber(passPercent)}% পেতে হবে।
          </p>
        )}
      </div>

      {newBadges.length > 0 && (
        <div className="w-full rounded-3xl bg-yellow-100 p-4 ring-2 ring-yellow-300">
          <p className="mb-2 text-lg font-extrabold text-yellow-800">🎁 নতুন ব্যাজ পেয়েছ!</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {newBadges.map((b) => (
              <li key={b.code} className="animate-pop flex flex-col items-center rounded-2xl bg-white px-4 py-2 shadow">
                <span className="text-4xl" aria-hidden>
                  {b.icon}
                </span>
                <span className="text-sm font-bold">{b.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isGuest && (
        <p className="rounded-2xl bg-sky-100 px-4 py-3 text-base font-semibold text-sky-900">
          সাইন ইন করলে ব্যাজ জিততে পারবে আর প্রতিদিন খেলার ধারা (streak) রাখতে পারবে।{" "}
          <Link href="/login" className="underline">
            সাইন ইন
          </Link>
        </p>
      )}

      <div className="flex w-full flex-col gap-3">
        {passed && nextLevelHref && (
          <LinkButton href={nextLevelHref} size="xl" className="h-16 bg-green-500 text-xl hover:bg-green-600">
            পরের লেভেল <ArrowRight />
          </LinkButton>
        )}
        <Button size="xl" variant={passed && nextLevelHref ? "secondary" : "default"} className="h-16" onClick={onReplay}>
          <RotateCcw /> আবার খেলো
        </Button>
        <LinkButton href={mapHref} size="xl" variant="outline" className="h-14">
          <Map /> লেভেল ম্যাপ
        </LinkButton>
      </div>
    </div>
  );
}
