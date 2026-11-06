import { Card } from "@/components/ui/card";

/** Shown instead of content until Supabase env vars are configured. */
export function SetupNotice() {
  return (
    <Card className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6">
      <h2 className="text-xl font-extrabold">🛠️ সেটআপ বাকি আছে</h2>
      <p className="mt-2 text-base">
        Supabase এখনো যুক্ত করা হয়নি। <code className="rounded bg-white px-1">.env.local</code> ফাইলে{" "}
        <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_URL</code> ও{" "}
        <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> দাও, মাইগ্রেশন চালাও এবং{" "}
        <code className="rounded bg-white px-1">npm run seed</code> দাও। বিস্তারিত README-তে আছে।
      </p>
    </Card>
  );
}
