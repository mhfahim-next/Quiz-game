"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getAdminContext } from "@/lib/admin/auth";
import {
  categorySchema,
  csvRowSchema,
  fieldErrorsOf,
  levelSchema,
  MAX_CSV_ROWS,
  questionSchema,
  type ActionResult,
} from "@/lib/admin/schemas";

const BUCKET = "quiz-images";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const DENIED_MESSAGE = "অনুমতি নেই — অ্যাডমিন হিসেবে সাইন ইন করো।";
const DENIED = { ok: false, error: DENIED_MESSAGE } as const satisfies ActionResult;

type Ctx = NonNullable<Awaited<ReturnType<typeof getAdminContext>>>;

function refresh() {
  // players see content changes immediately
  revalidatePath("/", "layout");
}

function dbMessage(message: string): string {
  if (message.includes("duplicate key")) return "এই মান আগে থেকেই আছে (ডুপ্লিকেট)।";
  if (message.includes("row-level security")) return DENIED_MESSAGE;
  return `ডাটাবেস ত্রুটি: ${message}`;
}

function dbError(message: string): ActionResult {
  return { ok: false, error: dbMessage(message) };
}

// ---------------------------------------------------------------------------
// image helpers (Supabase Storage, admin-only writes enforced by storage RLS)
// ---------------------------------------------------------------------------
async function uploadImage(ctx: Ctx, file: File, folder: "questions" | "categories") {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "ছবি অবশ্যই PNG, JPG, WEBP বা GIF হতে হবে।" } as const;
  if (file.size > MAX_IMAGE_BYTES) return { error: "ছবি সর্বোচ্চ ২ MB হতে পারবে।" } as const;
  const path = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await ctx.supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { error: `ছবি আপলোড হয়নি: ${error.message}` } as const;
  return { url: ctx.supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl } as const;
}

async function removeImage(ctx: Ctx, url: string | null | undefined) {
  if (!url) return;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return; // external URL (e.g. from CSV) — not ours to delete
  await ctx.supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))]);
}

function fileFrom(formData: FormData): File | null {
  const f = formData.get("image");
  return f instanceof File && f.size > 0 ? f : null;
}

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------
export async function saveCategory(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "তথ্য ঠিক নেই", fieldErrors: fieldErrorsOf(parsed.error) };
  const { id, remove_image, ...fields } = parsed.data;

  let existingUrl: string | null = null;
  if (id) {
    const { data } = await ctx.supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
    existingUrl = data?.image_url ?? null;
  }

  let image_url: string | null | undefined;
  const file = fileFrom(formData);
  if (file) {
    const up = await uploadImage(ctx, file, "categories");
    if ("error" in up) return { ok: false, error: up.error ?? "ছবি আপলোড হয়নি" };
    image_url = up.url;
  } else if (remove_image) {
    image_url = null;
  }

  const row = { ...fields, description: fields.description ?? null, icon: fields.icon ?? null, ...(image_url !== undefined && { image_url }) };
  const res = id
    ? await ctx.supabase.from("categories").update(row).eq("id", id)
    : await ctx.supabase.from("categories").insert(row);
  if (res.error) return dbError(res.error.message);

  if (image_url !== undefined) await removeImage(ctx, existingUrl);
  refresh();
  return { ok: true, message: "সেভ হয়েছে ✅" };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;
  const { data } = await ctx.supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
  const { error } = await ctx.supabase.from("categories").delete().eq("id", id);
  if (error) return dbError(error.message);
  await removeImage(ctx, data?.image_url);
  refresh();
  return { ok: true };
}

export async function setCategoryPublished(id: string, published: boolean): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;
  const { error } = await ctx.supabase.from("categories").update({ is_published: published }).eq("id", id);
  if (error) return dbError(error.message);
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// levels
// ---------------------------------------------------------------------------
export async function saveLevel(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;

  const parsed = levelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "তথ্য ঠিক নেই", fieldErrors: fieldErrorsOf(parsed.error) };
  const { id, ...fields } = parsed.data;

  if (id) {
    const { category_id: _ignored, ...update } = fields; // a level never moves between categories
    void _ignored;
    const { error } = await ctx.supabase.from("levels").update(update).eq("id", id);
    if (error) return dbError(error.message);
  } else {
    const { data: last } = await ctx.supabase
      .from("levels")
      .select("position")
      .eq("category_id", fields.category_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await ctx.supabase.from("levels").insert({ ...fields, position: (last?.position ?? 0) + 1 });
    if (error) return dbError(error.message);
  }
  refresh();
  return { ok: true, message: "সেভ হয়েছে ✅" };
}

export async function deleteLevel(id: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;
  const { data: level } = await ctx.supabase.from("levels").select("category_id").eq("id", id).maybeSingle();
  const { error } = await ctx.supabase.from("levels").delete().eq("id", id);
  if (error) return dbError(error.message);
  if (level) {
    // close the gap so positions stay 1..n
    const { data: rest } = await ctx.supabase.from("levels").select("id").eq("category_id", level.category_id).order("position");
    if (rest?.length) await ctx.supabase.rpc("reorder_levels", { p_category_id: level.category_id, p_ids: rest.map((l) => l.id) });
  }
  refresh();
  return { ok: true };
}

export async function setLevelPublished(id: string, published: boolean): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;
  const { error } = await ctx.supabase.from("levels").update({ is_published: published }).eq("id", id);
  if (error) return dbError(error.message);
  refresh();
  return { ok: true };
}

/** Swap a level with its neighbour (reorder_levels RPC renumbers atomically). */
export async function moveLevel(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;
  const { data: level } = await ctx.supabase.from("levels").select("category_id").eq("id", id).maybeSingle();
  if (!level) return { ok: false, error: "লেভেল পাওয়া যায়নি" };
  const { data: all, error } = await ctx.supabase
    .from("levels")
    .select("id")
    .eq("category_id", level.category_id)
    .order("position");
  if (error || !all) return dbError(error?.message ?? "unknown");
  const ids = all.map((l) => l.id);
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const res = await ctx.supabase.rpc("reorder_levels", { p_category_id: level.category_id, p_ids: ids });
  if (res.error) return dbError(res.error.message);
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// questions
// ---------------------------------------------------------------------------
export async function saveQuestion(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;

  const raw = {
    ...Object.fromEntries(formData),
    options: [0, 1, 2, 3].map((i) => formData.get(`option_${i}`) ?? ""),
  };
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "তথ্য ঠিক নেই", fieldErrors: fieldErrorsOf(parsed.error) };
  const { id, remove_image, options, explanation, ...fields } = parsed.data;
  if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
    return { ok: false, error: "চারটি বিকল্পই আলাদা হতে হবে", fieldErrors: { "options.0": "বিকল্প আলাদা হতে হবে" } };
  }

  let existingUrl: string | null = null;
  if (id) {
    const { data } = await ctx.supabase.from("questions").select("image_url").eq("id", id).maybeSingle();
    existingUrl = data?.image_url ?? null;
  }

  let image_url: string | null | undefined;
  const file = fileFrom(formData);
  if (file) {
    const up = await uploadImage(ctx, file, "questions");
    if ("error" in up) return { ok: false, error: up.error ?? "ছবি আপলোড হয়নি" };
    image_url = up.url;
  } else if (remove_image) {
    image_url = null;
  }

  const row = { ...fields, options, explanation: explanation ?? null, ...(image_url !== undefined && { image_url }) };
  const res = id
    ? await ctx.supabase.from("questions").update(row).eq("id", id)
    : await ctx.supabase.from("questions").insert(row);
  if (res.error) return dbError(res.error.message);

  if (image_url !== undefined) await removeImage(ctx, existingUrl);
  refresh();
  return { ok: true, message: "সেভ হয়েছে ✅" };
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return DENIED;
  const { data } = await ctx.supabase.from("questions").select("image_url").eq("id", id).maybeSingle();
  const { error } = await ctx.supabase.from("questions").delete().eq("id", id);
  if (error) return dbError(error.message);
  await removeImage(ctx, data?.image_url);
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// CSV import (all-or-nothing)
// ---------------------------------------------------------------------------
export type ImportResult =
  | { ok: true; inserted: number }
  | { ok: false; error: string; rowErrors?: { row: number; message: string }[] };

export async function importQuestions(rows: unknown): Promise<ImportResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, error: DENIED_MESSAGE };
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "কোনো সারি পাওয়া যায়নি।" };
  if (rows.length > MAX_CSV_ROWS) return { ok: false, error: `একবারে সর্বোচ্চ ${MAX_CSV_ROWS}টি প্রশ্ন ইমপোর্ট করা যায়।` };

  // 1) validate every row
  const rowErrors: { row: number; message: string }[] = [];
  const valid: { row: number; data: ReturnType<typeof csvRowSchema.parse> }[] = [];
  rows.forEach((raw, i) => {
    const res = csvRowSchema.safeParse(raw);
    if (res.success) valid.push({ row: i + 2, data: res.data }); // +2 = header line + 1-based
    else rowErrors.push({ row: i + 2, message: res.error.issues.map((x) => x.message).join("; ") });
  });

  // 2) resolve category_slug + level -> level_id
  const slugs = [...new Set(valid.map((v) => v.data.category_slug))];
  const { data: cats, error: cErr } = await ctx.supabase.from("categories").select("id, slug").in("slug", slugs);
  if (cErr) return { ok: false, error: dbMessage(cErr.message) };
  const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));
  const { data: lvls } = await ctx.supabase
    .from("levels")
    .select("id, category_id, position")
    .in("category_id", [...catBySlug.values()]);
  const levelKey = (cat: string, pos: number) => `${cat}:${pos}`;
  const levelByKey = new Map((lvls ?? []).map((l) => [levelKey(l.category_id, l.position), l.id]));

  const inserts: {
    level_id: string;
    text: string;
    options: string[];
    correct_index: number;
    explanation: string | null;
    image_url: string | null;
  }[] = [];
  for (const { row, data } of valid) {
    const catId = catBySlug.get(data.category_slug);
    if (!catId) {
      rowErrors.push({ row, message: `বিভাগ "${data.category_slug}" পাওয়া যায়নি` });
      continue;
    }
    const levelId = levelByKey.get(levelKey(catId, data.level));
    if (!levelId) {
      rowErrors.push({ row, message: `"${data.category_slug}" বিভাগে লেভেল ${data.level} নেই` });
      continue;
    }
    const options = [data.option1, data.option2, data.option3, data.option4];
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
      rowErrors.push({ row, message: "চারটি বিকল্প আলাদা হতে হবে" });
      continue;
    }
    inserts.push({
      level_id: levelId,
      text: data.text,
      options,
      correct_index: data.correct - 1,
      explanation: data.explanation ?? null,
      image_url: data.image_url ?? null,
    });
  }

  if (rowErrors.length > 0) {
    rowErrors.sort((a, b) => a.row - b.row);
    return { ok: false, error: "ভুল থাকায় কিছুই ইমপোর্ট হয়নি। ঠিক করে আবার চেষ্টা করো।", rowErrors: rowErrors.slice(0, 50) };
  }

  // 3) single insert statement => atomic
  const { error } = await ctx.supabase.from("questions").insert(inserts);
  if (error) return { ok: false, error: dbMessage(error.message) };
  refresh();
  return { ok: true, inserted: inserts.length };
}
