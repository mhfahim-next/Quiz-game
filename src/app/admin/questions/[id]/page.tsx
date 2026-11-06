import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/question-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getLevelOptions } from "@/lib/admin/level-options";

export const metadata: Metadata = { title: "প্রশ্ন সম্পাদনা" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data: question } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();
  if (!question) notFound();
  const levels = await getLevelOptions(supabase);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">প্রশ্ন সম্পাদনা</h1>
      <QuestionForm levels={levels} question={question} />
    </div>
  );
}
