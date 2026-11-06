import "server-only";
import { toBanglaNumber } from "@/lib/bangla";
import type { createClient } from "@/lib/supabase/server";

/** "🐘 প্রাণী — লেভেল ১" options for the question form's level picker. */
export async function getLevelOptions(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: cats }, { data: levels }] = await Promise.all([
    supabase.from("categories").select("id, name, icon, position").order("position"),
    supabase.from("levels").select("id, category_id, position").order("position"),
  ]);
  return (cats ?? []).flatMap((c) =>
    (levels ?? [])
      .filter((l) => l.category_id === c.id)
      .map((l) => ({ id: l.id, label: `${c.icon ?? ""} ${c.name} — লেভেল ${toBanglaNumber(l.position)}`.trim() })),
  );
}
