import type { Metadata } from "next";
import { QuestionForm } from "@/components/admin/question-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getLevelOptions } from "@/lib/admin/level-options";

export const metadata: Metadata = { title: "নতুন প্রশ্ন" };

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  const { supabase } = await requireAdmin();
  const levels = await getLevelOptions(supabase);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">নতুন প্রশ্ন</h1>
      {levels.length === 0 ? (
        <p className="rounded-2xl bg-white p-6">আগে একটি বিভাগ ও লেভেল তৈরি করো।</p>
      ) : (
        <QuestionForm levels={levels} defaultLevelId={level} />
      )}
    </div>
  );
}
