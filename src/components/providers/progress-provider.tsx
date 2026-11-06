"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { clearGuestProgress, loadGuestProgress, saveGuestProgress } from "@/lib/guest-progress";
import { calcStars, percentOf, type Stars } from "@/lib/scoring";
import { effectiveStreak } from "@/lib/streak";
import type { ProgressMap, ServerAttemptResult } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

export type PlayerProfile = Pick<
  Tables<"profiles">,
  "id" | "role" | "display_name" | "current_streak" | "longest_streak" | "last_played_on"
>;

export type RecordAttemptInput = {
  levelId: string;
  passPercent: number;
  score: number;
  total: number;
  answers: { question_id: string; selected: number }[];
};

type ProgressContextValue = {
  /** false until localStorage / the session has been read (avoid flashing locked levels) */
  ready: boolean;
  user: User | null;
  profile: PlayerProfile | null;
  streak: number;
  progress: ProgressMap;
  recordAttempt: (input: RecordAttemptInput) => Promise<ServerAttemptResult | null>;
  signOut: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => (isSupabaseConfigured ? createClient() : null), []);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const progressRef = useRef<ProgressMap>({});
  const userIdRef = useRef<string | null>(null);

  const commitProgress = useCallback((map: ProgressMap) => {
    progressRef.current = map;
    setProgress(map);
  }, []);

  const loadRemote = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const [prog, prof] = await Promise.all([
        supabase.from("user_progress").select("level_id, best_score, stars, unlocked"),
        supabase
          .from("profiles")
          .select("id, role, display_name, current_streak, longest_streak, last_played_on")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      if (!prog.error) {
        const map: ProgressMap = {};
        for (const r of prog.data) {
          map[r.level_id] = { best_score: r.best_score, stars: r.stars as Stars, unlocked: r.unlocked };
        }
        commitProgress(map);
      }
      if (!prof.error) setProfile(prof.data);
    },
    [supabase, commitProgress],
  );

  const hydrate = useCallback(
    async (nextUser: User | null) => {
      userIdRef.current = nextUser?.id ?? null;
      setUser(nextUser);
      if (!nextUser || !supabase) {
        setProfile(null);
        commitProgress(loadGuestProgress());
        setReady(true);
        return;
      }
      // Move any guest progress into the account, then use the account as the source of truth.
      const guest = loadGuestProgress();
      const items = Object.entries(guest).map(([level_id, p]) => ({
        level_id,
        best_score: p.best_score,
        stars: p.stars,
      }));
      if (items.length > 0) {
        const { error } = await supabase.rpc("merge_progress", { p_items: items });
        if (!error) clearGuestProgress();
      }
      await loadRemote(nextUser.id);
      setReady(true);
    },
    [supabase, loadRemote, commitProgress],
  );

  useEffect(() => {
    if (!supabase) {
      commitProgress(loadGuestProgress());
      setReady(true);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) void hydrate(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      const nextId = session?.user?.id ?? null;
      // Tab re-focus fires SIGNED_IN again for the same user — ignore it.
      if (event === "SIGNED_IN" && nextId === userIdRef.current) return;
      // Never call supabase from inside this callback directly (deadlock risk) — defer.
      setTimeout(() => active && void hydrate(session?.user ?? null), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, hydrate, commitProgress]);

  const recordAttempt = useCallback<ProgressContextValue["recordAttempt"]>(
    async ({ levelId, passPercent, score, total, answers }) => {
      // 1) optimistic local update so the map is right even if the network call fails
      const percent = percentOf(score, total);
      const stars = calcStars(percent, passPercent);
      const prev = progressRef.current[levelId];
      const next: ProgressMap = {
        ...progressRef.current,
        [levelId]: {
          best_score: Math.max(prev?.best_score ?? 0, percent),
          stars: Math.max(prev?.stars ?? 0, stars) as Stars,
          unlocked: true,
        },
      };
      commitProgress(next);
      if (!userIdRef.current) saveGuestProgress(next);

      // 2) server grading (also counts guest plays for the admin dashboard)
      if (!supabase) return null;
      const { data, error } = await supabase.rpc("submit_attempt", { p_level_id: levelId, p_answers: answers });
      if (error || !data) return null;
      if (userIdRef.current) await loadRemote(userIdRef.current);
      return data as unknown as ServerAttemptResult;
    },
    [supabase, commitProgress, loadRemote],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    router.refresh();
  }, [supabase, router]);

  const streak = profile ? effectiveStreak(profile.current_streak, profile.last_played_on) : 0;

  const value = useMemo<ProgressContextValue>(
    () => ({ ready, user, profile, streak, progress, recordAttempt, signOut }),
    [ready, user, profile, streak, progress, recordAttempt, signOut],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
