# 🎓 Quiz Kids (কুইজ কিডস)

A Bangla quiz game for children aged 5–10: big picture cards, a level map with locked/unlocked levels and
stars, instant feedback with sound, a read‑aloud button, guest play with optional sign‑in, and an admin panel.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, Storage) · Zod

## Features

**Players**
- Home with large category cards (প্রাণী, ফল, গণিত, বাংলা বর্ণমালা, ইংরেজি)
- Level map — level N+1 unlocks after scoring ≥ the level's pass % (default 70 %); 1–3 stars per level
- Quiz screen — progress bar, one question per screen, optional image, 4 big answer buttons,
  correct/wrong animation, sound effects, 🔊 button that reads the question aloud (Web Speech API, `bn-BD`)
- Result screen — score, stars, "আবার খেলো" and "পরের লেভেল"
- Guest play works with no login (progress in `localStorage`). Optional sign‑in (email/password or Google)
  syncs progress, awards badges and keeps a daily streak
- Installable PWA with an offline fallback page

**Admin (`/admin`)**
- Only `profiles.role = 'admin'`; enforced by middleware **and** server checks **and** Postgres RLS
- CRUD for categories, levels and questions (image upload to Supabase Storage)
- Reorder levels, publish/draft toggles
- Bulk CSV import of questions
- Dashboard: total plays, plays in the last 7 days, players, average score per level, most‑missed questions

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Create a Supabase project and set env vars

Create a project at [supabase.com](https://supabase.com), then in **Project Settings → API** copy the values into `.env.local`:

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (safe to expose; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **only** `npm run seed`. Never expose it or prefix it with `NEXT_PUBLIC_` |

### 3. Run the migrations

The SQL lives in `supabase/migrations/` and must run in order:

| File | Contents |
| --- | --- |
| `…0001_schema.sql` | tables: `profiles`, `categories`, `levels`, `questions`, `attempts`, `attempt_answers`, `user_progress`, `badges`, `user_badges` |
| `…0002_functions.sql` | `is_admin()`, signup trigger, `submit_attempt()`, `merge_progress()`, `reorder_levels()`, admin views, badge reference data |
| `…0003_rls.sql` | Row Level Security policies |
| `…0004_storage.sql` | public `quiz-images` bucket; only admins can write |

**Option A – Supabase CLI (recommended, also gives you a local stack)**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push            # applies supabase/migrations/*
```

For a fully local stack (needs Docker): `npx supabase start` then `npx supabase db reset`
(this applies the migrations **and** `supabase/seed.sql`).

**Option B – SQL editor:** paste each migration file, in order, into **SQL Editor → New query** and run it.

### 4. Seed the content

5 categories × 3 levels × 10 Bangla questions (150 questions):

```bash
npm run seed          # through the API with the service-role key (idempotent)
```

or paste `supabase/seed.sql` into the SQL editor (also idempotent). `supabase/seed.sql` is generated from
`scripts/seed-data.ts` by `npm run seed:sql` — edit the TypeScript file, then regenerate.

### 5. Authentication settings

In **Authentication → URL Configuration** add `http://localhost:3000/auth/callback` (and your production URL +
`/auth/callback`) to *Redirect URLs*.

- **Email:** works out of the box. For quick local testing you may turn off *Confirm email*.
- **Google:** enable it under **Authentication → Providers → Google** with an OAuth client from Google Cloud
  (authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`).

### 6. Create the first admin

Admins are made in the database on purpose — there is no UI path to become one.

1. Run the app and sign up at `/login` (“নতুন? অ্যাকাউন্ট খোলো”).
2. In the Supabase **SQL editor** run:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Reload — a 🛡️ icon appears in the header and `/admin` opens. (Players cannot change their own role:
   `UPDATE` on `profiles` is limited to `display_name` by column privileges *and* an RLS check.)

### 7. Run

```bash
npm run dev       # http://localhost:3000
npm run build && npm start
```

Other scripts: `npm run lint`, `npm run typecheck`.

## CSV import format

`/admin/import` accepts UTF‑8 CSV (a BOM is fine). Download a sample from the page
(`public/templates/questions-template.csv`).

```csv
category_slug,level,text,option1,option2,option3,option4,correct,explanation,image_url
animals,1,"🐘 এটি কোন প্রাণী?","হাতি","ঘোড়া","গরু","বাঘ",1,"হাতি অনেক বড় প্রাণী।",
```

- `category_slug` + `level` (the level number) identify the target level, which must already exist
- `correct` is the **1‑based** number of the right option (1–4)
- `explanation` and `image_url` are optional; up to 500 rows per import
- Every row is validated with Zod; if any row is invalid **nothing is imported** and the bad rows are listed

## How it works

### Scoring, stars and unlocking
- `percent = round(correct / total × 100)`; stars: **3** ≥ 90 %, **2** ≥ 80 %, **1** = passed (≥ `pass_percent`), **0** = not passed
  (`src/lib/scoring.ts`, mirrored by `public.calc_stars()` in SQL)
- Level N+1 is open when level N has ≥ 1 star (i.e. was passed) — shown on the map and enforced by the play screen.
  For signed‑in users `user_progress.unlocked` is also written by the server
- `user_progress.best_score` is a percentage (0–100)

### Server‑side grading
The quiz is graded by the `submit_attempt(level_id, answers)` SQL function (works for guests too; it never trusts a
score from the client). It records the attempt + per‑question results (feeding the admin "most missed" report) and, for
signed‑in users, updates progress, unlocks the next level, advances the daily streak (Bangladesh calendar day) and
awards badges. Options are shuffled on the server, so answers are submitted by their **original** option index.

### Guest → account
Guest progress is stored in `localStorage` (`quizkids:progress:v1`). On sign‑in it is merged into the account with
`merge_progress()` (best‑of), then cleared from the device.

### Security model (RLS)
- Published categories/levels/questions are publicly readable; drafts are visible only to admins
- Players read/write only their own `user_progress`, read their own attempts, badges and profile
- Attempts are created only through `submit_attempt()` (no direct `INSERT` policy)
- Admins (`public.is_admin()`) have full access, including the `admin_*` reporting views
- Storage: `quiz-images` is world‑readable, writable only by admins (PNG/JPEG/WEBP/GIF, ≤ 2 MB)
- `/admin` is guarded three times: `src/middleware.ts`, `requireAdmin()` in the admin layout/pages, and
  `getAdminContext()` at the top of every Server Action — with RLS as the final backstop

### Folder structure

```
src/
  app/                    routes: / · /c/[slug] · /play/[levelId] · /profile · /login · /auth/callback · /admin/*
  components/
    quiz/                 QuestionCard, AnswerButton, StarRating, QuizPlayer, ResultScreen, SpeakButton, PlayGate
    levels/               LevelMap
    home/                 CategoryCard
    admin/                forms, dialogs, CSV import, row actions
    providers/            ProgressProvider (guest + synced progress)
    ui/                   shadcn/ui components
  lib/
    supabase/             browser / server / middleware clients + typed database.types.ts
    data/                 server-side content queries (Server Components)
    admin/                Server Actions, Zod schemas, admin guard
    scoring.ts · sfx.ts · speech.ts · guest-progress.ts · streak.ts
scripts/                  seed-data.ts, seed.ts (API), generate-seed-sql.ts
supabase/                 migrations/, seed.sql, config.toml
public/                   sw.js, offline.html, icons/, templates/
```

### Regenerating database types
`src/lib/supabase/database.types.ts` is maintained to match the migrations. After changing the schema you can regenerate it with
`npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

## Notes
- **Speech:** `bn-BD` text‑to‑speech needs a Bangla voice on the device (most Android/Chrome and recent iOS have one).
  If none is available the browser falls back to its default voice, and the 🔊 button is hidden when the Web Speech API is unsupported.
- **Sound:** effects are synthesized with the Web Audio API (no audio files); the 🔊/🔇 header button mutes them.
- **Animations** respect `prefers-reduced-motion`.
- **PWA:** the service worker is registered in production builds only. It never caches `/admin`, `/profile`, `/login`
  or API calls.
