"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { saveQuestion } from "@/lib/admin/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { Field } from "./field";
import { SubmitButton } from "./submit-button";
import { useAdminForm } from "./use-admin-form";

export type LevelOption = { id: string; label: string };

export function QuestionForm({
  levels,
  question,
  defaultLevelId,
}: {
  levels: LevelOption[];
  question?: Tables<"questions">;
  defaultLevelId?: string;
}) {
  const router = useRouter();
  const { state, onSubmit, pending, errors } = useAdminForm(saveQuestion);
  const options = Array.isArray(question?.options) ? (question.options as string[]) : ["", "", "", ""];
  const levelId = question?.level_id ?? defaultLevelId ?? levels[0]?.id;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "সেভ হয়েছে");
      router.push(`/admin/questions?level=${levelId ?? ""}`);
    } else toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-5">
      {question && <input type="hidden" name="id" value={question.id} />}

      <Field label="লেভেল" htmlFor="q-level" error={errors.level_id}>
        <NativeSelect id="q-level" name="level_id" defaultValue={levelId} required>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="প্রশ্ন" htmlFor="q-text" error={errors.text}>
        <Textarea id="q-text" name="text" required maxLength={300} rows={3} defaultValue={question?.text} className="text-base" />
      </Field>

      <Field label="ছবি (ঐচ্ছিক, সর্বোচ্চ ২ MB)" htmlFor="q-image">
        {question?.image_url && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.image_url} alt="" className="max-h-24 rounded-lg" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_image" value="true" /> ছবি সরাও
            </label>
          </div>
        )}
        <Input id="q-image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
      </Field>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">৪টি বিকল্প — সঠিক উত্তরের পাশের বাটন বেছে নাও</legend>
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="correct_index"
                value={i}
                defaultChecked={(question?.correct_index ?? 0) === i}
                aria-label={`বিকল্প ${i + 1} সঠিক উত্তর`}
                className="size-6 accent-green-600"
              />
              <Input
                name={`option_${i}`}
                required
                maxLength={100}
                defaultValue={options[i] ?? ""}
                placeholder={`বিকল্প ${i + 1}`}
                aria-label={`বিকল্প ${i + 1}`}
              />
            </div>
            {errors[`options.${i}`] && <p className="ml-9 mt-1 text-sm font-semibold text-red-600">{errors[`options.${i}`]}</p>}
          </div>
        ))}
        {errors.correct_index && <p className="text-sm font-semibold text-red-600">{errors.correct_index}</p>}
      </fieldset>

      <Field label="ব্যাখ্যা (ঐচ্ছিক)" htmlFor="q-exp" error={errors.explanation} hint="উত্তর দেওয়ার পর বাচ্চাকে দেখানো হয়">
        <Textarea id="q-exp" name="explanation" maxLength={300} rows={2} defaultValue={question?.explanation ?? ""} />
      </Field>

      <SubmitButton pending={pending} className="h-11 w-full sm:w-auto">সেভ করো</SubmitButton>
    </form>
  );
}
