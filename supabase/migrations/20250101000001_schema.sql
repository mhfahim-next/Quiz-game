-- Quiz Kids — core schema
-- Run order: 0001 schema -> 0002 functions -> 0003 rls -> 0004 storage

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (created by trigger, see 0002)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           text not null default 'player' check (role in ('player', 'admin')),
  display_name   text,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_played_on date,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- content
-- ---------------------------------------------------------------------------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  icon         text,                -- emoji or short text shown on the card
  image_url    text,                -- optional uploaded picture (Storage)
  color        text not null default '#f97316',
  position     integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.levels (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.categories (id) on delete cascade,
  position       integer not null check (position >= 1),
  pass_percent   integer not null default 70 check (pass_percent between 1 and 100),
  question_count integer not null default 10 check (question_count between 1 and 50),
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  -- deferrable so positions can be swapped inside one statement/transaction
  constraint levels_category_position_key unique (category_id, position)
    deferrable initially deferred
);
create index levels_category_idx on public.levels (category_id);

create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  level_id      uuid not null references public.levels (id) on delete cascade,
  text          text not null,
  image_url     text,
  options       jsonb not null,
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation   text,
  created_at    timestamptz not null default now(),
  constraint questions_options_shape check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
  )
);
create index questions_level_idx on public.questions (level_id);

-- ---------------------------------------------------------------------------
-- play data
-- ---------------------------------------------------------------------------
-- attempts.user_id is NULL for guest plays (still counted in admin stats).
-- score = number of correct answers, total = number of questions asked.
create table public.attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  level_id   uuid not null references public.levels (id) on delete cascade,
  score      integer not null check (score >= 0),
  total      integer not null check (total > 0),
  stars      smallint not null default 0 check (stars between 0 and 3),
  created_at timestamptz not null default now(),
  check (score <= total)
);
create index attempts_user_idx  on public.attempts (user_id, created_at desc);
create index attempts_level_idx on public.attempts (level_id);

create table public.attempt_answers (
  attempt_id  uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  is_correct  boolean not null,
  primary key (attempt_id, question_id)
);
create index attempt_answers_question_idx on public.attempt_answers (question_id);

-- best_score is a PERCENT (0-100) so levels with different sizes compare.
create table public.user_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  level_id   uuid not null references public.levels (id) on delete cascade,
  best_score integer not null default 0 check (best_score between 0 and 100),
  stars      smallint not null default 0 check (stars between 0 and 3),
  unlocked   boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

create table public.badges (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text not null,
  icon        text not null default '🏅'
);

create table public.user_badges (
  user_id   uuid not null references auth.users (id) on delete cascade,
  badge_id  uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
