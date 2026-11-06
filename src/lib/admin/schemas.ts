import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const checkbox = z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean());

export const categorySchema = z.object({
  id: z.preprocess(emptyToUndefined, z.uuid().optional()),
  name: z.string().trim().min(1, "নাম দিতে হবে").max(60, "নাম সর্বোচ্চ ৬০ অক্ষর"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug-এ শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন (-) চলবে")
    .min(2)
    .max(40),
  description: optionalText(120),
  icon: optionalText(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "রঙ #rrggbb ফরম্যাটে দাও"),
  position: z.coerce.number().int().min(0).max(999).default(0),
  is_published: checkbox,
  remove_image: checkbox.optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const levelSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.uuid().optional()),
  category_id: z.uuid("বিভাগ বেছে নাও"),
  pass_percent: z.coerce.number().int().min(1, "১–১০০ এর মধ্যে দাও").max(100, "১–১০০ এর মধ্যে দাও"),
  question_count: z.coerce.number().int().min(1, "কমপক্ষে ১").max(50, "সর্বোচ্চ ৫০"),
  is_published: checkbox,
});
export type LevelInput = z.infer<typeof levelSchema>;

const optionText = z.string().trim().min(1, "সব বিকল্প পূরণ করো").max(100, "বিকল্প সর্বোচ্চ ১০০ অক্ষর");

export const questionSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.uuid().optional()),
  level_id: z.uuid("লেভেল বেছে নাও"),
  text: z.string().trim().min(1, "প্রশ্ন লেখো").max(300, "প্রশ্ন সর্বোচ্চ ৩০০ অক্ষর"),
  options: z.tuple([optionText, optionText, optionText, optionText]),
  correct_index: z.coerce.number().int().min(0).max(3),
  explanation: optionalText(300),
  remove_image: checkbox.optional(),
});
export type QuestionInput = z.infer<typeof questionSchema>;

/** One CSV row. `correct` is 1-4 for humans; `level` is the level position within the category. */
export const csvRowSchema = z.object({
  category_slug: z.string().trim().min(1, "category_slug দরকার"),
  level: z.coerce.number().int().min(1, "level হলো ১, ২, ৩…"),
  text: z.string().trim().min(1, "text দরকার").max(300),
  option1: optionText,
  option2: optionText,
  option3: optionText,
  option4: optionText,
  correct: z.coerce.number().int().min(1, "correct হলো ১–৪").max(4, "correct হলো ১–৪"),
  explanation: optionalText(300),
  image_url: z.preprocess(emptyToUndefined, z.url("image_url সঠিক URL নয়").optional()),
});
export type CsvRow = z.infer<typeof csvRowSchema>;

export const MAX_CSV_ROWS = 500;
export const CSV_COLUMNS = [
  "category_slug",
  "level",
  "text",
  "option1",
  "option2",
  "option3",
  "option4",
  "correct",
  "explanation",
  "image_url",
] as const;

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Flatten a ZodError into { field: message } (first message per field). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] === "options" ? `options.${String(issue.path[1] ?? 0)}` : String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
