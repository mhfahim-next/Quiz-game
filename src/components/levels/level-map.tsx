"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useProgress } from "@/components/providers/progress-provider";
import { StarRating } from "@/components/quiz/star-rating";
import { toBanglaNumber } from "@/lib/bangla";
import type { Level } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  color: string;
  levels: Pick<Level, "id" | "position" | "pass_percent">[];
};

// zig-zag the nodes to make a winding path
const OFFSETS = ["justify-center", "justify-end pr-6", "justify-center", "justify-start pl-6"];

/**
 * Locked / unlocked level path with stars.
 * Level N+1 is open when level N has been passed (stars > 0) — or the DB says it is unlocked.
 */
export function LevelMap({ color, levels }: Props) {
  const { progress, ready } = useProgress();
  const sorted = [...levels].sort((a, b) => a.position - b.position);

  return (
    <ol className="relative mx-auto flex max-w-sm flex-col gap-6 py-4">
      <span aria-hidden className="absolute inset-y-8 left-1/2 w-1.5 -translate-x-1/2 rounded-full border-l-4 border-dashed border-white/80" />
      {sorted.map((level, i) => {
        const prev = sorted[i - 1];
        const p = progress[level.id];
        const unlocked = i === 0 || p?.unlocked === true || (prev ? (progress[prev.id]?.stars ?? 0) > 0 : false);
        const stars = p?.stars ?? 0;
        const current = unlocked && stars === 0;

        const node = (
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "relative grid size-24 place-items-center rounded-full border-4 border-white text-4xl font-extrabold shadow-xl transition-transform",
                unlocked ? "text-white active:scale-95" : "bg-slate-300 text-slate-500",
                current && "animate-float ring-4 ring-yellow-300",
              )}
              style={unlocked ? { background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 70%, black))` } : undefined}
            >
              {unlocked ? toBanglaNumber(level.position) : <Lock className="size-9" aria-hidden />}
            </div>
            <span className="rounded-full bg-white/90 px-3 py-0.5 text-sm font-bold shadow-sm">
              লেভেল {toBanglaNumber(level.position)}
            </span>
            <StarRating value={ready ? stars : 0} size="md" />
            {unlocked && p && p.best_score > 0 && (
              <span className="text-xs font-semibold text-slate-600">সেরা: {toBanglaNumber(p.best_score)}%</span>
            )}
            {!unlocked && (
              <span className="text-xs font-semibold text-slate-500">
                আগের লেভেলে {toBanglaNumber(prev?.pass_percent ?? 70)}% পেলে খুলবে
              </span>
            )}
          </div>
        );

        return (
          <li key={level.id} className={cn("relative z-10 flex", OFFSETS[i % OFFSETS.length])}>
            {unlocked ? (
              <Link
                href={`/play/${level.id}`}
                aria-label={`লেভেল ${toBanglaNumber(level.position)} খেলো`}
                className="rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400"
              >
                {node}
              </Link>
            ) : (
              <div aria-label={`লেভেল ${toBanglaNumber(level.position)} — বন্ধ`}>{node}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
