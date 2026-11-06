import { CategoryCard } from "@/components/home/category-card";
import { SetupNotice } from "@/components/home/setup-notice";
import { getCategories } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const categories = isSupabaseConfigured ? await getCategories() : [];

  return (
    <div className="flex flex-col gap-5">
      {denied && (
        <p role="alert" className="rounded-2xl bg-red-100 px-4 py-3 text-base font-bold text-red-800">
          এই পাতায় ঢোকার অনুমতি তোমার নেই।
        </p>
      )}
      <section className="text-center">
        <h1 className="text-3xl font-extrabold text-violet-700 sm:text-4xl">কী শিখতে চাও? 🌈</h1>
        <p className="mt-1 text-lg font-semibold text-slate-600">একটি ছবিতে ট্যাপ করো</p>
      </section>

      {!isSupabaseConfigured && <SetupNotice />}

      {isSupabaseConfigured && categories.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-lg font-semibold">এখনো কোনো বিভাগ নেই। একটু পরে আবার দেখো!</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} levelIds={c.levels.map((l) => l.id)} />
        ))}
      </div>
    </div>
  );
}
