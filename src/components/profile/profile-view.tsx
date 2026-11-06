"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, LogOut, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { useProgress } from "@/components/providers/progress-provider";
import { createClient } from "@/lib/supabase/client";
import { toBanglaNumber } from "@/lib/bangla";
import { cn } from "@/lib/utils";

type BadgeInfo = { code: string; name: string; description: string; icon: string };

export function ProfileView({ badges, earnedCodes }: { badges: BadgeInfo[]; earnedCodes: string[] }) {
  const { ready, user, profile, streak, progress, signOut } = useProgress();
  const totalStars = Object.values(progress).reduce((s, p) => s + p.stars, 0);
  const passed = Object.values(progress).filter((p) => p.stars > 0).length;
  const [name, setName] = useState<string | null>(null);

  if (!ready) return <div className="grid min-h-[40dvh] place-items-center text-5xl animate-float">⏳</div>;

  async function saveName() {
    if (!user || name === null) return;
    const clean = name.trim().slice(0, 40);
    const { error } = await createClient().from("profiles").update({ display_name: clean || null }).eq("id", user.id);
    if (error) toast.error("নাম সেভ করা যায়নি");
    else toast.success("নাম সেভ হয়েছে ✅");
  }

  const earned = new Set(earnedCodes);

  return (
    <div className="flex flex-col gap-5">
      <Card className="items-center gap-2 rounded-3xl p-6 text-center">
        <div className="text-6xl" aria-hidden>
          {user ? "🦁" : "🐣"}
        </div>
        <h1 className="text-2xl font-extrabold text-violet-700">
          {user ? (profile?.display_name ?? "বন্ধু") : "অতিথি খেলোয়াড়"}
        </h1>
        {user && <p className="text-sm text-slate-500">{user.email}</p>}

        <div className="mt-2 grid w-full grid-cols-3 gap-3">
          <Stat icon={<Star className="size-6 fill-yellow-400 text-yellow-500" />} value={totalStars} label="তারা" />
          <Stat icon={<span className="text-2xl">✅</span>} value={passed} label="লেভেল পাস" />
          <Stat icon={<Flame className="size-6 text-orange-500" />} value={user ? streak : 0} label="দিনের ধারা" />
        </div>
      </Card>

      {!user ? (
        <Card className="items-center gap-3 rounded-3xl bg-sky-50 p-6 text-center ring-2 ring-sky-200">
          <p className="text-lg font-bold">তোমার অগ্রগতি এই ডিভাইসে সেভ আছে।</p>
          <p className="text-base font-medium text-slate-600">
            সাইন ইন করলে ব্যাজ জিততে পারবে, প্রতিদিন খেলার ধারা রাখতে পারবে এবং অন্য ডিভাইসেও অগ্রগতি পাবে।
          </p>
          <LinkButton href="/login?next=/profile" size="xl" className="w-full">
            সাইন ইন / অ্যাকাউন্ট খোলো
          </LinkButton>
        </Card>
      ) : (
        <Card className="gap-3 rounded-3xl p-5">
          <label htmlFor="display-name" className="text-base font-bold">
            আমার নাম
          </label>
          <div className="flex gap-2">
            <Input
              id="display-name"
              value={name ?? profile?.display_name ?? ""}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="h-12 text-lg"
            />
            <Button size="xl" onClick={saveName} disabled={name === null}>
              সেভ
            </Button>
          </div>
        </Card>
      )}

      <section aria-labelledby="badges-title">
        <h2 id="badges-title" className="mb-3 text-2xl font-extrabold">
          🏅 আমার ব্যাজ
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((b) => {
            const has = earned.has(b.code);
            return (
              <li
                key={b.code}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-3xl p-4 text-center shadow-sm",
                  has ? "bg-white ring-2 ring-yellow-300" : "bg-white/50 opacity-60 grayscale",
                )}
              >
                <span className="text-5xl" aria-hidden>
                  {b.icon}
                </span>
                <span className="text-base font-extrabold">{b.name}</span>
                <span className="text-xs font-medium text-slate-600">{b.description}</span>
                <span className="sr-only">{has ? "পেয়েছ" : "এখনো পাওনি"}</span>
              </li>
            );
          })}
        </ul>
        {!user && <p className="mt-2 text-center text-sm font-semibold text-slate-500">ব্যাজ পেতে সাইন ইন করো।</p>}
      </section>

      <div className="flex flex-col gap-3">
        <LinkButton href="/" size="xl" variant="secondary">
          খেলতে যাও
        </LinkButton>
        {user && (
          <Button size="xl" variant="outline" onClick={signOut}>
            <LogOut /> সাইন আউট
          </Button>
        )}
        {profile?.role === "admin" && (
          <Link href="/admin" className="text-center font-bold text-emerald-700 underline">
            অ্যাডমিন প্যানেল
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-amber-50 p-3">
      {icon}
      <span className="text-2xl font-extrabold">{toBanglaNumber(value)}</span>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </div>
  );
}
