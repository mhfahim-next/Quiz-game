import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin/auth";
import { toBanglaNumber } from "@/lib/bangla";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [plays, recent, players, levelStats, missed] = await Promise.all([
    supabase.from("attempts").select("*", { count: "exact", head: true }),
    supabase.from("attempts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("admin_level_stats").select("*").order("category_name").order("position"),
    supabase.from("admin_missed_questions").select("*").order("times_missed", { ascending: false }).order("miss_rate", { ascending: false }).limit(10),
  ]);

  const stats = levelStats.data ?? [];
  const totalPlays = plays.count ?? 0;
  const weighted = stats.reduce((s, l) => s + Number(l.avg_percent ?? 0) * Number(l.plays ?? 0), 0);
  const overallAvg = totalPlays > 0 ? Math.round(weighted / Math.max(1, stats.reduce((s, l) => s + Number(l.plays ?? 0), 0))) : 0;

  const cards = [
    { label: "মোট প্লে", value: toBanglaNumber(totalPlays), icon: "🎮" },
    { label: "গত ৭ দিনে", value: toBanglaNumber(recent.count ?? 0), icon: "📅" },
    { label: "নিবন্ধিত খেলোয়াড়", value: toBanglaNumber(players.count ?? 0), icon: "👧" },
    { label: "গড় স্কোর", value: `${toBanglaNumber(overallAvg)}%`, icon: "🎯" },
  ];

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-extrabold">ড্যাশবোর্ড</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="gap-1 rounded-2xl p-4">
            <span className="text-2xl" aria-hidden>
              {c.icon}
            </span>
            <span className="text-3xl font-extrabold">{c.value}</span>
            <span className="text-sm font-semibold text-slate-500">{c.label}</span>
          </Card>
        ))}
      </div>

      <section className="grid gap-2">
        <h2 className="text-xl font-extrabold">লেভেল অনুযায়ী গড় স্কোর</h2>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>বিভাগ</TableHead>
                <TableHead>লেভেল</TableHead>
                <TableHead className="text-right">প্লে</TableHead>
                <TableHead className="text-right">গড় স্কোর</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">
                    এখনো কোনো তথ্য নেই
                  </TableCell>
                </TableRow>
              )}
              {stats.map((l) => (
                <TableRow key={l.level_id}>
                  <TableCell>{l.category_name}</TableCell>
                  <TableCell>লেভেল {toBanglaNumber(l.position ?? 0)}</TableCell>
                  <TableCell className="text-right">{toBanglaNumber(l.plays ?? 0)}</TableCell>
                  <TableCell className="text-right font-bold">
                    {Number(l.plays) > 0 ? `${toBanglaNumber(Math.round(Number(l.avg_percent)))}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="grid gap-2">
        <h2 className="text-xl font-extrabold">সবচেয়ে বেশি ভুল হওয়া প্রশ্ন</h2>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>প্রশ্ন</TableHead>
                <TableHead>বিভাগ / লেভেল</TableHead>
                <TableHead className="text-right">ভুল / মোট</TableHead>
                <TableHead className="text-right">ভুলের হার</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(missed.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">
                    এখনো কোনো তথ্য নেই
                  </TableCell>
                </TableRow>
              )}
              {(missed.data ?? []).map((q) => (
                <TableRow key={q.question_id}>
                  <TableCell className="max-w-xs whitespace-normal">{q.text}</TableCell>
                  <TableCell>
                    {q.category_name} / {toBanglaNumber(q.level_position ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {toBanglaNumber(q.times_missed ?? 0)} / {toBanglaNumber(q.times_asked ?? 0)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">{toBanglaNumber(Math.round(Number(q.miss_rate ?? 0)))}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
