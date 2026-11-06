"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useProgress } from "@/components/providers/progress-provider";
import { toBanglaNumber } from "@/lib/bangla";
import type { Category } from "@/lib/types";

type Props = {
  category: Category;
  levelIds: string[];
};

/** Large picture card for a category on the home screen. */
export function CategoryCard({ category, levelIds }: Props) {
  const { progress, ready } = useProgress();
  const earned = levelIds.reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0);
  const max = levelIds.length * 3;

  return (
    <Link
      href={`/c/${category.slug}`}
      className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[2rem] p-3 text-center text-white shadow-lg ring-4 ring-white transition-transform focus-visible:outline-none focus-visible:ring-violet-500 active:scale-95"
      style={{ background: `linear-gradient(145deg, ${category.color}, color-mix(in srgb, ${category.color} 65%, black))` }}
    >
      <span className="absolute -right-6 -top-6 size-24 rounded-full bg-white/15" aria-hidden />
      <span className="absolute -bottom-8 -left-8 size-28 rounded-full bg-white/10" aria-hidden />
      {category.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.image_url} alt="" className="relative size-20 rounded-2xl object-cover sm:size-24" />
      ) : (
        <span className="relative text-6xl drop-shadow transition-transform group-hover:scale-110 sm:text-7xl" aria-hidden>
          {category.icon ?? "❓"}
        </span>
      )}
      <span className="relative text-2xl font-extrabold drop-shadow-sm">{category.name}</span>
      {max > 0 && (
        <span className="relative inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-sm font-bold">
          <Star className="size-4 fill-yellow-300 text-yellow-300" aria-hidden />
          {ready ? toBanglaNumber(earned) : "–"} / {toBanglaNumber(max)}
        </span>
      )}
    </Link>
  );
}
