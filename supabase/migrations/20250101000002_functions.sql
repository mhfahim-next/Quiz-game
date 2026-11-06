-- Helper + business-logic functions

-- ---------------------------------------------------------------------------
-- role helpers (SECURITY DEFINER so policies on `profiles` don't recurse)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- create a profile whenever somebody signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- stars: 3 >= 90%, 2 >= 80%, 1 = passed, 0 = not passed
-- (keep in sync with src/lib/scoring.ts)
-- ---------------------------------------------------------------------------
create or replace function public.calc_stars(p_percent integer, p_pass integer)
returns smallint
language sql immutable
as $$
  select case
    when p_percent < p_pass then 0
    when p_percent >= 90 then 3
    when p_percent >= 80 then 2
    else 1
  end::smallint;
$$;

-- ---------------------------------------------------------------------------
-- unlock the level after p_level_id (same category, next published position)
-- ---------------------------------------------------------------------------
create or replace function public.unlock_next_level(p_user uuid, p_level uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_next uuid;
begin
  select n.id into v_next
  from public.levels c
  join public.levels n
    on n.category_id = c.category_id and n.position > c.position and n.is_published
  where c.id = p_level
  order by n.position
  limit 1;

  if v_next is not null then
    insert into public.user_progress (user_id, level_id, unlocked)
    values (p_user, v_next, true)
    on conflict (user_id, level_id)
      do update set unlocked = true, updated_at = now();
  end if;
  return v_next;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_attempt: server-side grading. Works for guests (no user) and
-- signed-in users. Never trusts a score sent by the client.
--   p_answers = [{"question_id": "<uuid>", "selected": 0..3}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.submit_attempt(p_level_id uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_level     public.levels%rowtype;
  v_total     integer;
  v_score     integer;
  v_percent   integer;
  v_stars     smallint;
  v_passed    boolean;
  v_attempt   uuid;
  v_next      uuid;
  v_today     date := (now() at time zone 'Asia/Dhaka')::date;
  v_profile   public.profiles%rowtype;
  v_streak    integer := 0;
  v_codes     text[] := array[]::text[];
  v_new       jsonb := '[]'::jsonb;
  v_prev_pass boolean;
  v_star_sum  integer;
  v_cat       uuid;
  v_graded    jsonb;
begin
  select l.* into v_level
  from public.levels l
  join public.categories c on c.id = l.category_id
  where l.id = p_level_id and l.is_published and c.is_published;
  if not found then
    raise exception 'level not found or not published' using errcode = 'P0002';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'answers must be an array' using errcode = '22023';
  end if;

  -- grade: one row per distinct question that belongs to this level
  select count(*), count(*) filter (where g.is_correct),
         coalesce(jsonb_agg(jsonb_build_object('q', g.question_id, 'c', g.is_correct)), '[]'::jsonb)
    into v_total, v_score, v_graded
  from (
    select distinct on (q.id)
           q.id as question_id,
           coalesce(a.selected = q.correct_index, false) as is_correct
    from jsonb_to_recordset(p_answers) as a(question_id uuid, selected integer)
    join public.questions q on q.id = a.question_id and q.level_id = p_level_id
    order by q.id
  ) g;

  if v_total = 0 then
    raise exception 'no valid answers' using errcode = '22023';
  end if;
  if v_total > v_level.question_count then
    raise exception 'too many answers' using errcode = '22023';
  end if;

  v_percent := round(v_score * 100.0 / v_total);
  v_stars   := public.calc_stars(v_percent, v_level.pass_percent);
  v_passed  := v_percent >= v_level.pass_percent;

  insert into public.attempts (user_id, level_id, score, total, stars)
  values (v_user, p_level_id, v_score, v_total, v_stars)
  returning id into v_attempt;

  insert into public.attempt_answers (attempt_id, question_id, is_correct)
  select v_attempt, (x ->> 'q')::uuid, (x ->> 'c')::boolean
  from jsonb_array_elements(v_graded) x;

  -- next level id (returned for guests too, so the UI can link to it)
  select n.id into v_next
  from public.levels n
  where n.category_id = v_level.category_id and n.position > v_level.position and n.is_published
  order by n.position
  limit 1;

  if v_user is not null then
    select exists (
      select 1 from public.user_progress
      where user_id = v_user and level_id = p_level_id and stars > 0
    ) into v_prev_pass;

    insert into public.user_progress (user_id, level_id, best_score, stars, unlocked)
    values (v_user, p_level_id, v_percent, v_stars, true)
    on conflict (user_id, level_id) do update
      set best_score = greatest(public.user_progress.best_score, excluded.best_score),
          stars      = greatest(public.user_progress.stars, excluded.stars),
          unlocked   = true,
          updated_at = now();

    if v_passed then
      perform public.unlock_next_level(v_user, p_level_id);
    end if;

    -- daily streak (Asia/Dhaka calendar day)
    select * into v_profile from public.profiles where id = v_user for update;
    if found then
      if v_profile.last_played_on = v_today then
        v_streak := v_profile.current_streak;
      elsif v_profile.last_played_on = v_today - 1 then
        v_streak := v_profile.current_streak + 1;
      else
        v_streak := 1;
      end if;
      update public.profiles
         set current_streak = v_streak,
             longest_streak = greatest(longest_streak, v_streak),
             last_played_on = v_today
       where id = v_user;
    end if;

    -- badges
    v_codes := array['first_play'];
    if v_passed and not v_prev_pass then v_codes := array_append(v_codes, 'first_pass'); end if;
    if v_percent = 100 then v_codes := array_append(v_codes, 'perfect'); end if;
    if v_streak >= 3 then v_codes := array_append(v_codes, 'streak_3'); end if;
    if v_streak >= 7 then v_codes := array_append(v_codes, 'streak_7'); end if;

    select coalesce(sum(stars), 0) into v_star_sum from public.user_progress where user_id = v_user;
    if v_star_sum >= 10 then v_codes := array_append(v_codes, 'stars_10'); end if;
    if v_star_sum >= 25 then v_codes := array_append(v_codes, 'stars_25'); end if;

    -- category master: every published level in the category has been passed
    v_cat := v_level.category_id;
    if v_passed and not exists (
      select 1 from public.levels l
      left join public.user_progress up on up.level_id = l.id and up.user_id = v_user
      where l.category_id = v_cat and l.is_published and coalesce(up.stars, 0) = 0
    ) then
      v_codes := array_append(v_codes, 'category_master');
    end if;

    with ins as (
      insert into public.user_badges (user_id, badge_id)
      select v_user, b.id from public.badges b where b.code = any (v_codes)
      on conflict do nothing
      returning badge_id
    )
    select coalesce(jsonb_agg(jsonb_build_object(
             'code', b.code, 'name', b.name, 'description', b.description, 'icon', b.icon)), '[]'::jsonb)
      into v_new
    from ins join public.badges b on b.id = ins.badge_id;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'score', v_score,
    'total', v_total,
    'percent', v_percent,
    'stars', v_stars,
    'passed', v_passed,
    'next_level_id', v_next,
    'streak', v_streak,
    'new_badges', v_new
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- merge_progress: push guest (localStorage) progress into the signed-in account
--   p_items = [{"level_id": "<uuid>", "best_score": 0..100, "stars": 0..3}]
-- ---------------------------------------------------------------------------
create or replace function public.merge_progress(p_items jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  r record;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return;
  end if;

  for r in
    select i.level_id, least(greatest(i.best_score, 0), 100) as best_score,
           least(greatest(i.stars, 0), 3)::smallint as stars
    from jsonb_to_recordset(p_items) as i(level_id uuid, best_score integer, stars integer)
    join public.levels l on l.id = i.level_id
  loop
    insert into public.user_progress (user_id, level_id, best_score, stars, unlocked)
    values (v_user, r.level_id, r.best_score, r.stars, true)
    on conflict (user_id, level_id) do update
      set best_score = greatest(public.user_progress.best_score, excluded.best_score),
          stars      = greatest(public.user_progress.stars, excluded.stars),
          unlocked   = true,
          updated_at = now();

    if r.stars > 0 then
      perform public.unlock_next_level(v_user, r.level_id);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- reorder_levels: admin-only (SECURITY INVOKER -> RLS enforces admin)
-- ---------------------------------------------------------------------------
create or replace function public.reorder_levels(p_category_id uuid, p_ids uuid[])
returns void
language plpgsql security invoker set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.levels l
     set position = o.ord
    from unnest(p_ids) with ordinality as o(id, ord)
   where l.id = o.id and l.category_id = p_category_id;
end;
$$;

grant execute on function public.submit_attempt(uuid, jsonb) to anon, authenticated;
grant execute on function public.merge_progress(jsonb)      to authenticated;
grant execute on function public.reorder_levels(uuid, uuid[]) to authenticated;
revoke execute on function public.merge_progress(jsonb) from anon;

-- ---------------------------------------------------------------------------
-- admin reporting views (security_invoker + explicit is_admin() filter: non-admins get 0 rows)
-- ---------------------------------------------------------------------------
create or replace view public.admin_level_stats
with (security_invoker = true) as
select l.id as level_id,
       c.id as category_id,
       c.name as category_name,
       l.position,
       count(a.id) as plays,
       coalesce(round(avg(a.score * 100.0 / a.total), 1), 0) as avg_percent
from public.levels l
join public.categories c on c.id = l.category_id
left join public.attempts a on a.level_id = l.id
where public.is_admin()
group by l.id, c.id, c.name, l.position;

create or replace view public.admin_missed_questions
with (security_invoker = true) as
select q.id as question_id,
       q.text,
       c.name as category_name,
       l.position as level_position,
       count(aa.question_id) as times_asked,
       count(*) filter (where not aa.is_correct) as times_missed,
       round(100.0 * count(*) filter (where not aa.is_correct) / nullif(count(aa.question_id), 0), 1) as miss_rate
from public.questions q
join public.levels l on l.id = q.level_id
join public.categories c on c.id = l.category_id
join public.attempt_answers aa on aa.question_id = q.id
where public.is_admin()
group by q.id, q.text, c.name, l.position;

-- ---------------------------------------------------------------------------
-- reference data: badges
-- ---------------------------------------------------------------------------
insert into public.badges (code, name, description, icon) values
  ('first_play',      'প্রথম খেলা',      'প্রথমবার কুইজ খেলেছ!',               '🎈'),
  ('first_pass',      'প্রথম জয়',       'প্রথমবার একটি লেভেল পাস করেছ!',      '🎉'),
  ('perfect',         'সব ঠিক!',        'একটি কুইজে সবগুলো উত্তর ঠিক!',        '💯'),
  ('streak_3',        '৩ দিনের ধারা',    'টানা ৩ দিন খেলেছ!',                  '🔥'),
  ('streak_7',        '৭ দিনের ধারা',    'টানা ৭ দিন খেলেছ!',                  '🌟'),
  ('stars_10',        '১০ তারা',         'মোট ১০টি তারা জিতেছ!',               '⭐'),
  ('stars_25',        '২৫ তারা',         'মোট ২৫টি তারা জিতেছ!',               '🌠'),
  ('category_master', 'বিভাগ চ্যাম্পিয়ন', 'একটি বিভাগের সব লেভেল পাস করেছ!',    '🏆')
on conflict (code) do nothing;
