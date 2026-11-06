import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LevelMap } from "@/components/levels/level-map";
import { LinkButton } from "@/components/ui/link-button";
import { getCategoryWithLevels } from "@/lib/data/content";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryWithLevels(slug);
  if (!data) notFound();
  const { category, levels } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <LinkButton href="/" variant="secondary" size="icon-lg" aria-label="হোমে ফিরে যাও" className="size-12 rounded-full">
          <ArrowLeft className="size-6" />
        </LinkButton>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold" style={{ color: category.color }}>
          <span aria-hidden>{category.icon}</span> {category.name}
        </h1>
      </div>
      {levels.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-lg font-semibold">এই বিভাগে এখনো লেভেল নেই।</p>
      ) : (
        <LevelMap color={category.color} levels={levels} />
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryWithLevels(slug);
  return { title: data?.category.name ?? "বিভাগ" };
}
