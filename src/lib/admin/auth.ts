import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin guard, layer 2 (layer 1 is middleware, layer 3 is Postgres RLS).
 * Returns the Supabase client + user when the caller has profiles.role = 'admin', otherwise null.
 */
export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  return { supabase, user };
}

/** For pages/layouts: redirect instead of returning null. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const ctx = await getAdminContext();
  if (!ctx) redirect("/?denied=1");
  return ctx;
}
