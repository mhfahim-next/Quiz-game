import type { Tables } from "@/lib/supabase/database.types";
import type { Stars } from "@/lib/scoring";

export type Category = Tables<"categories">;
export type Level = Tables<"levels">;
export type Badge = Tables<"badges">;

/**
 * A question as sent to the player. Options are already shuffled and correct_index remapped;
 * `order[shownIndex]` is the option's ORIGINAL index, which is what submit_attempt() grades.
 */
export type QuizQuestion = {
  id: string;
  text: string;
  image_url: string | null;
  options: string[];
  order: number[];
  correct_index: number;
  explanation: string | null;
};

export type LevelProgress = { best_score: number; stars: Stars; unlocked: boolean };
export type ProgressMap = Record<string, LevelProgress>;

export type EarnedBadge = Pick<Badge, "code" | "name" | "description" | "icon">;

/** Shape returned by public.submit_attempt() */
export type ServerAttemptResult = {
  attempt_id: string;
  score: number;
  total: number;
  percent: number;
  stars: Stars;
  passed: boolean;
  next_level_id: string | null;
  streak: number;
  new_badges: EarnedBadge[];
};
