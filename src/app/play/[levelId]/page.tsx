import { notFound } from "next/navigation";
import { PlayGate } from "@/components/quiz/play-gate";
import { getLevelForPlay } from "@/lib/data/content";

// Questions are shuffled per request, so this page must never be cached.
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ levelId: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const [{ levelId }, { r }] = await Promise.all([params, searchParams]);
  if (!UUID.test(levelId)) notFound();
  const data = await getLevelForPlay(levelId);
  if (!data) notFound();

  return (
    // `key` resets all quiz state when "play again" navigates with a new ?r=
    <PlayGate
      key={r ?? "first"}
      levelId={data.level.id}
      passPercent={data.level.pass_percent}
      previousLevelId={data.previousLevelId}
      nextLevelId={data.nextLevelId}
      categorySlug={data.category.slug}
      questions={data.questions}
    />
  );
}
