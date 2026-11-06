"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/safe-redirect";

const schema = z.object({
  email: z.email("সঠিক ইমেইল দাও"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
  name: z.string().trim().max(40).optional(),
});

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "ইমেইল বা পাসওয়ার্ড ঠিক নেই।";
  if (m.includes("already registered")) return "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে। সাইন ইন করো।";
  if (m.includes("email not confirmed")) return "আগে ইমেইলের লিংকে ক্লিক করে নিশ্চিত করো।";
  return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করো।";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return <Card className="rounded-3xl p-6 text-center text-lg font-semibold">সাইন ইন এখনো চালু হয়নি (Supabase সেটআপ বাকি)।</Card>;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      name: String(form.get("name") ?? "") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "তথ্য ঠিক নেই");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
      setBusy(false);
      if (error) return toast.error(friendlyError(error.message));
      toast.success("স্বাগতম! 🎉");
      router.replace(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: parsed.data.name ? { full_name: parsed.data.name } : undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) return toast.error(friendlyError(error.message));
      if (data.session) {
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে! 🎉");
        router.replace(next);
        router.refresh();
      } else {
        toast.success("ইমেইলে একটি লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে নিশ্চিত করো।");
      }
    }
  }

  async function google() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setBusy(false);
      toast.error("Google দিয়ে সাইন ইন করা যায়নি।");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="text-center">
        <div className="text-6xl" aria-hidden>
          🦉
        </div>
        <h1 className="text-3xl font-extrabold text-violet-700">{mode === "signin" ? "সাইন ইন" : "নতুন অ্যাকাউন্ট"}</h1>
        <p className="text-base font-semibold text-slate-600">সাইন ইন করলে তোমার অগ্রগতি, ব্যাজ ও streak সেভ থাকবে।</p>
      </div>

      <Card className="gap-4 rounded-3xl p-5">
        <Button type="button" size="xl" variant="outline" disabled={busy} onClick={google}>
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
            <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
            <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M6 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.4a11 11 0 0 0 0 9.8L6 14.1z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.4 7.1L6 9.9c.8-2.6 3.2-4.5 6-4.5z" />
          </svg>
          Google দিয়ে সাইন ইন
        </Button>

        <div className="flex items-center gap-3 text-sm font-semibold text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> অথবা <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          {mode === "signup" && (
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-base">তোমার নাম</Label>
              <Input id="name" name="name" autoComplete="nickname" maxLength={40} className="h-12 text-lg" />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-base">ইমেইল</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="h-12 text-lg" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-base">পাসওয়ার্ড</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="h-12 text-lg"
            />
          </div>
          <Button type="submit" size="xl" disabled={busy} className="h-14">
            {mode === "signin" ? "ঢুকে পড়ো" : "অ্যাকাউন্ট খোলো"}
          </Button>
        </form>

        <button
          type="button"
          className="text-base font-bold text-violet-700 underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "নতুন? অ্যাকাউন্ট খোলো" : "আগেই অ্যাকাউন্ট আছে? সাইন ইন করো"}
        </button>
      </Card>

      <Link href="/" className="text-center text-base font-bold text-slate-600 underline">
        সাইন ইন ছাড়াই খেলি →
      </Link>
    </div>
  );
}
