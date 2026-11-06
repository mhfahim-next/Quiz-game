"use client";

import Link from "next/link";
import { Flame, Shield, UserRound, Volume2, VolumeX } from "lucide-react";
import { useProgress } from "@/components/providers/progress-provider";
import { useMuted } from "@/hooks/use-muted";
import { toBanglaNumber } from "@/lib/bangla";
import { sfx } from "@/lib/sfx";

const chip =
  "inline-flex h-12 min-w-12 items-center justify-center gap-1 rounded-full bg-white/90 px-3 text-base font-bold shadow-sm ring-1 ring-black/5 transition active:scale-95";

export function AppHeader() {
  const { user, profile, streak } = useProgress();
  const [muted, setMuted] = useMuted();

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-amber-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-violet-700">
          <span className="text-3xl" aria-hidden>
            🎓
          </span>
          <span>কুইজ কিডস</span>
        </Link>
        <nav className="flex items-center gap-2">
          {streak > 0 && (
            <span className={`${chip} text-orange-600`} title="টানা কত দিন খেলেছ">
              <Flame className="size-5" aria-hidden />
              {toBanglaNumber(streak)}
            </span>
          )}
          {profile?.role === "admin" && (
            <Link href="/admin" className={`${chip} text-emerald-700`} aria-label="অ্যাডমিন প্যানেল">
              <Shield className="size-5" aria-hidden />
            </Link>
          )}
          <button
            type="button"
            className={chip}
            aria-label={muted ? "শব্দ চালু করো" : "শব্দ বন্ধ করো"}
            aria-pressed={muted}
            onClick={() => {
              setMuted(!muted);
              if (muted) sfx.tap();
            }}
          >
            {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
          </button>
          <Link href="/profile" className={`${chip} ${user ? "text-violet-700" : ""}`} aria-label="আমার প্রোফাইল">
            <UserRound className="size-5" aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}
