const DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** 12 -> "১২" */
export function toBanglaNumber(n: number | string): string {
  return String(n).replace(/\d/g, (d) => DIGITS[Number(d)]);
}
