import type { Metadata } from "next";
import Link from "next/link";
import { Check, Pencil, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { DeleteButton } from "@/components/admin/row-actions";
import { deleteQuestion } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";
import { toBanglaNumber } from "@/lib/bangla";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "প্রশ্ন" };

const LIMIT = 200;

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level: levelParam } = await searchParams;
  const { supabase } = await requireAdmin();

  const [{ data: categories }, { data: levels }] = await Promise.all([
    supabase.from("categories").select("id, name, icon").order("position"),
    supabase.from("levels").select("id, category_id, position").order("position"),
  ]);

  const selectedLevel = (levels ?? []).find((l) => l.id === levelParam) ?? levels?.[0];
  const { data: questions } = selectedLevel
    ? await supabase.from("questions").select("*").eq("level_id", selectedLevel.id).order("created_at").limit(LIMIT)
    : { data: [] };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">প্রশ্ন</h1>
        {selectedLevel && (
          <LinkButton href={`/admin/questions/new?level=${selectedLevel.id}`}>
            <Plus /> নতুন প্রশ্ন
          </LinkButton>
        )}
      </div>

      <div className="grid gap-2">
        {(categories ?? []).map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <span className="w-28 shrink-0 text-sm font-bold">
              {c.icon} {c.name}
            </span>
            {(levels ?? [])
              .filter((l) => l.category_id === c.id)
              .map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/questions?level=${l.id}`}
                  aria-current={l.id === selectedLevel?.id ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-bold ring-1 ring-black/5",
                    l.id === selectedLevel?.id ? "bg-violet-600 text-white" : "bg-white text-violet-800 hover:bg-violet-50",
                  )}
                >
                  লেভেল {toBanglaNumber(l.position)}
                </Link>
              ))}
          </div>
        ))}
      </div>

      <ul className="grid gap-3">
        {(questions ?? []).map((q, i) => {
          const options = Array.isArray(q.options) ? (q.options as string[]) : [];
          return (
            <li key={q.id}>
              <Card className="gap-2 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-sm font-bold text-slate-400">{toBanglaNumber(i + 1)}.</span>
                  <p className="flex-1 text-lg font-bold leading-snug">{q.text}</p>
                  {q.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.image_url} alt="" className="size-14 rounded-lg object-cover" />
                  )}
                </div>
                <ul className="grid gap-1 text-sm sm:grid-cols-2">
                  {options.map((o, n) => (
                    <li key={n} className={cn("flex items-center gap-1 rounded-lg px-2 py-1", n === q.correct_index ? "bg-green-100 font-bold text-green-900" : "bg-slate-50")}>
                      {n === q.correct_index && <Check className="size-4" aria-label="সঠিক" />} {o}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2">
                  <LinkButton href={`/admin/questions/${q.id}`} size="sm" variant="outline">
                    <Pencil /> সম্পাদনা
                  </LinkButton>
                  <DeleteButton action={deleteQuestion.bind(null, q.id)} confirmText="এই প্রশ্নটি মুছে ফেলবে?" />
                </div>
              </Card>
            </li>
          );
        })}
        {(questions ?? []).length === 0 && <p className="rounded-2xl bg-white p-6 text-center">এই লেভেলে কোনো প্রশ্ন নেই।</p>}
      </ul>
      {(questions ?? []).length >= LIMIT && <p className="text-center text-sm text-slate-500">প্রথম {LIMIT}টি দেখানো হচ্ছে।</p>}
    </div>
  );
}
