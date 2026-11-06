import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Category, Level, QuizQuestion } from "@/lib/types";

/** Fisher–Yates, returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

export type CategoryWithLevels = Category & { levels: Pick<Level, "id" | "position">[] };

/** Published categories (RLS hides drafts) with their published level ids. */
export async function getCategories(): Promise<CategoryWithLevels[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const [cats, lvls] = await Promise.all([
    supabase.from("categories").select("*").order("position"),
    supabase.from("levels").select("id, category_id, position").order("position"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (lvls.error) throw new Error(lvls.error.message);
  return cats.data.map((c) => ({
    ...c,
    levels: lvls.data.filter((l) => l.category_id === c.id).map(({ id, position }) => ({ id, position })),
  }));
}

export async function getCategoryWithLevels(slug: string) {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: category, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!category) return null;
  const { data: levels, error: lErr } = await supabase
    .from("levels")
    .select("*")
    .eq("category_id", category.id)
    .order("position");
  if (lErr) throw new Error(lErr.message);
  return { category, levels };
}

export type PlayData = {
  level: Level;
  category: Category;
  previousLevelId: string | null;
  nextLevelId: string | null;
  questions: QuizQuestion[];
};

/** Everything the quiz screen needs. Questions are sampled and their options shuffled here (server-side). */
export async function getLevelForPlay(levelId: string): Promise<PlayData | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: level } = await supabase.from("levels").select("*").eq("id", levelId).maybeSingle();
  if (!level) return null;

  const [{ data: category }, { data: siblings }, { data: rows }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", level.category_id).maybeSingle(),
    supabase.from("levels").select("id, position").eq("category_id", level.category_id).order("position"),
    supabase.from("questions").select("*").eq("level_id", level.id),
  ]);
  if (!category) return null;

  const ordered = siblings ?? [];
  const idx = ordered.findIndex((l) => l.id === level.id);

  const questions: QuizQuestion[] = shuffle(rows ?? [])
    .slice(0, level.question_count)
    .flatMap((q) => {
      const options = parseOptions(q.options);
      if (options.length !== 4 || q.correct_index < 0 || q.correct_index > 3) return [];
      // `order[shown] = original index`; the DB grades by original index, the UI shows shuffled positions
      const order = shuffle([0, 1, 2, 3]);
      return [
        {
          id: q.id,
          text: q.text,
          image_url: q.image_url,
          options: order.map((i) => options[i]),
          order,
          correct_index: order.indexOf(q.correct_index),
          explanation: q.explanation,
        },
      ];
    });

  return {
    level,
    category,
    previousLevelId: idx > 0 ? ordered[idx - 1].id : null,
    nextLevelId: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1].id : null,
    questions,
  };
}
