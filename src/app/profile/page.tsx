import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "আমার প্রোফাইল" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let badges: { code: string; name: string; description: string; icon: string }[] = [];
  let earned: string[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from("badges").select("code, name, description, icon").order("code"),
      supabase.from("user_badges").select("badges(code)"),
    ]);
    badges = all ?? [];
    earned = (mine ?? []).flatMap((r) => {
      const b = r.badges as unknown as { code: string } | { code: string }[] | null;
      return Array.isArray(b) ? b.map((x) => x.code) : b ? [b.code] : [];
    });
  }

  return <ProfileView badges={badges} earnedCodes={earned} />;
}
