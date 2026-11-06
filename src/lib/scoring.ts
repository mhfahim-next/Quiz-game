/** Scoring rules. Keep in sync with public.calc_stars() in the SQL migrations. */
export type Stars = 0 | 1 | 2 | 3;

export const DEFAULT_PASS_PERCENT = 70;

export function percentOf(score: number, total: number): number {
  return total > 0 ? Math.round((score * 100) / total) : 0;
}

/** 3 stars >= 90%, 2 stars >= 80%, 1 star = passed, 0 = not passed. */
export function calcStars(percent: number, passPercent: number = DEFAULT_PASS_PERCENT): Stars {
  if (percent < passPercent) return 0;
  if (percent >= 90) return 3;
  if (percent >= 80) return 2;
  return 1;
}

export function isPassed(percent: number, passPercent: number = DEFAULT_PASS_PERCENT): boolean {
  return percent >= passPercent;
}
