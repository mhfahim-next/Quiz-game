-- Row Level Security
-- Principles:
--   * published content is readable by everyone (anon + authenticated)
--   * players read/write only their own progress
--   * admins (profiles.role = 'admin') have full access
--   * attempts are created only through submit_attempt() (SECURITY DEFINER)

alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.levels          enable row level security;
alter table public.questions       enable row level security;
alter table public.attempts        enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.user_progress   enable row level security;
alter table public.badges          enable row level security;
alter table public.user_badges     enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles: read own"   on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "profiles: admin read" on public.profiles for select to authenticated
  using (public.is_admin());
-- players may edit themselves, but never their role (also enforced by column grants below)
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role());
create policy "profiles: admin all"  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke update on public.profiles from authenticated, anon;
grant  update (display_name) on public.profiles to authenticated;

-- categories ----------------------------------------------------------------
create policy "categories: public read published" on public.categories for select
  to anon, authenticated using (is_published);
create policy "categories: admin all" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- levels --------------------------------------------------------------------
create policy "levels: public read published" on public.levels for select
  to anon, authenticated
  using (is_published and exists (
    select 1 from public.categories c where c.id = category_id and c.is_published));
create policy "levels: admin all" on public.levels for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- questions -----------------------------------------------------------------
create policy "questions: public read published" on public.questions for select
  to anon, authenticated
  using (exists (select 1 from public.levels l where l.id = level_id and l.is_published));
create policy "questions: admin all" on public.questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- attempts / attempt_answers (read-only; written by submit_attempt) -----------
create policy "attempts: read own"   on public.attempts for select to authenticated
  using (user_id = auth.uid());
create policy "attempts: admin read" on public.attempts for select to authenticated
  using (public.is_admin());

create policy "attempt_answers: read own" on public.attempt_answers for select to authenticated
  using (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy "attempt_answers: admin read" on public.attempt_answers for select to authenticated
  using (public.is_admin());

-- user_progress -------------------------------------------------------------
create policy "progress: own all" on public.user_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress: admin read" on public.user_progress for select to authenticated
  using (public.is_admin());

-- badges ----------------------------------------------------------------------
create policy "badges: public read" on public.badges for select to anon, authenticated
  using (true);
create policy "badges: admin all" on public.badges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "user_badges: read own"   on public.user_badges for select to authenticated
  using (user_id = auth.uid());
create policy "user_badges: admin read" on public.user_badges for select to authenticated
  using (public.is_admin());
