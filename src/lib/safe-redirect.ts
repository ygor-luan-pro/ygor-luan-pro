const MAX_LEN = 512;
const FORBIDDEN = /[\s\0]/;

export function isSafeRedirectTarget(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > MAX_LEN) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.startsWith("/\\")) return false;
  if (FORBIDDEN.test(value)) return false;
  return true;
}
