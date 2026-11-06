/** Only allow same-site relative paths as post-login redirect targets (blocks open redirects). */
export function safeNext(value: string | null | undefined, fallback = "/profile"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
