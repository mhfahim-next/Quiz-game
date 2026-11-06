/** Today's calendar date in Bangladesh time, as YYYY-MM-DD (matches submit_attempt()). */
export function todayInDhaka(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The streak shown to the child: it only counts if they played today or yesterday. */
export function effectiveStreak(current: number, lastPlayedOn: string | null, today: string = todayInDhaka()): number {
  if (!lastPlayedOn) return 0;
  return lastPlayedOn === today || lastPlayedOn === addDays(today, -1) ? current : 0;
}
