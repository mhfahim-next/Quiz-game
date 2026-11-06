/**
 * Seeds a hosted/local Supabase project through the API (service role key).
 * Idempotent (deterministic ids + upsert). Run: npm run seed
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (reads .env.local).
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { seedCategories, seedId } from "./seed-data";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

function check<T>(label: string, res: { error: { message: string } | null; data?: T }) {
  if (res.error) {
    console.error(`✖ ${label}: ${res.error.message}`);
    process.exit(1);
  }
}

async function main() {
  let questionCount = 0;
  for (const c of seedCategories) {
    const categoryId = seedId("category", c.slug);
    check(
      `category ${c.slug}`,
      await supabase.from("categories").upsert(
        { id: categoryId, slug: c.slug, name: c.name, description: c.description, icon: c.icon, color: c.color, position: c.position, is_published: true },
        { onConflict: "slug" },
      ),
    );
    for (const l of c.levels) {
      const levelId = seedId("level", c.slug, l.position);
      check(
        `level ${c.slug}/${l.position}`,
        await supabase.from("levels").upsert(
          { id: levelId, category_id: categoryId, position: l.position, pass_percent: l.pass_percent, question_count: l.question_count, is_published: true },
          { onConflict: "id" },
        ),
      );
      const rows = l.questions.map((q, i) => ({
        id: seedId("question", c.slug, l.position, i),
        level_id: levelId,
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
      }));
      check(`questions ${c.slug}/${l.position}`, await supabase.from("questions").upsert(rows, { onConflict: "id" }));
      questionCount += rows.length;
    }
    console.log(`✔ ${c.icon} ${c.name}`);
  }
  console.log(`Seeded ${seedCategories.length} categories, ${seedCategories.length * 3} levels, ${questionCount} questions.`);
}

main();
