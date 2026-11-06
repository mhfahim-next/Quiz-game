import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LevelDialog } from "@/components/admin/level-dialog";
import { DeleteButton, MoveButtons, PublishSwitch } from "@/components/admin/row-actions";
import { deleteLevel, moveLevel, setLevelPublished } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";
import { toBanglaNumber } from "@/lib/bangla";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "লেভেল" };

export default async function LevelsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: categoryParam } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase.from("categories").select("id, name, icon").order("position");
  const selected = (categories ?? []).find((c) => c.id === categoryParam) ?? categories?.[0];

  const levels = selected
    ? ((await supabase.from("levels").select("*").eq("category_id", selected.id).order("position")).data ?? [])
    : [];
  const { data: qs } = levels.length
    ? await supabase.from("questions").select("level_id").in("level_id", levels.map((l) => l.id))
    : { data: [] as { level_id: string }[] };
  const questionCount = (id: string) => (qs ?? []).filter((q) => q.level_id === id).length;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">লেভেল</h1>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="বিভাগ">
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/levels?category=${c.id}`}
            role="tab"
            aria-selected={c.id === selected?.id}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/5",
              c.id === selected?.id ? "bg-violet-600 text-white" : "bg-white text-violet-800 hover:bg-violet-50",
            )}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>

      {selected && (
        <>
          <div className="flex justify-end">
            <LevelDialog categoryId={selected.id} />
          </div>
          <ol className="grid gap-3">
            {levels.map((l, i) => (
              <li key={l.id}>
                <Card className="flex-row flex-wrap items-center gap-3 rounded-2xl p-4">
                  <MoveButtons canUp={i > 0} canDown={i < levels.length - 1} onMove={moveLevel.bind(null, l.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-extrabold">লেভেল {toBanglaNumber(l.position)}</p>
                    <p className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
                      <Badge variant="secondary">পাস {toBanglaNumber(l.pass_percent)}%</Badge>
                      <Badge variant="secondary">{toBanglaNumber(l.question_count)}টি প্রশ্ন দেখাবে</Badge>
                      <Link href={`/admin/questions?level=${l.id}`} className="font-bold text-violet-700 underline">
                        {toBanglaNumber(questionCount(l.id))}টি প্রশ্ন আছে
                      </Link>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PublishSwitch checked={l.is_published} label={`লেভেল ${l.position} প্রকাশ`} action={setLevelPublished.bind(null, l.id)} />
                    <LevelDialog categoryId={selected.id} level={l} />
                    <DeleteButton
                      action={deleteLevel.bind(null, l.id)}
                      confirmText={`লেভেল ${l.position} মুছলে এর সব প্রশ্নও মুছে যাবে। নিশ্চিত?`}
                    />
                  </div>
                </Card>
              </li>
            ))}
            {levels.length === 0 && <p className="rounded-2xl bg-white p-6 text-center">এই বিভাগে কোনো লেভেল নেই।</p>}
          </ol>
        </>
      )}
    </div>
  );
}
