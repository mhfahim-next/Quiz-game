import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { DeleteButton, PublishSwitch } from "@/components/admin/row-actions";
import { deleteCategory, setCategoryPublished } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "বিভাগ" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: levels }] = await Promise.all([
    supabase.from("categories").select("*").order("position"),
    supabase.from("levels").select("id, category_id"),
  ]);
  const levelCount = (id: string) => (levels ?? []).filter((l) => l.category_id === id).length;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">বিভাগ</h1>
        <CategoryDialog />
      </div>

      <ul className="grid gap-3">
        {(categories ?? []).map((c) => (
          <li key={c.id}>
            <Card className="flex-row flex-wrap items-center gap-3 rounded-2xl p-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-xl text-3xl text-white"
                style={{ background: c.color }}
                aria-hidden
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="size-14 rounded-xl object-cover" />
                ) : (
                  c.icon
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-extrabold">{c.name}</p>
                <p className="text-sm text-slate-500">
                  <code>{c.slug}</code> · ক্রম {c.position} · <Badge variant="secondary">{levelCount(c.id)} লেভেল</Badge>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PublishSwitch
                  checked={c.is_published}
                  label={`${c.name} প্রকাশ`}
                  action={setCategoryPublished.bind(null, c.id)}
                />
                <CategoryDialog category={c} />
                <DeleteButton
                  action={deleteCategory.bind(null, c.id)}
                  confirmText={`"${c.name}" বিভাগ মুছলে এর সব লেভেল ও প্রশ্নও মুছে যাবে। নিশ্চিত?`}
                />
              </div>
            </Card>
          </li>
        ))}
        {(categories ?? []).length === 0 && <p className="rounded-2xl bg-white p-6 text-center">কোনো বিভাগ নেই। একটি যোগ করো।</p>}
      </ul>
    </div>
  );
}
