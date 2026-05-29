import type { CookieOptions } from "@supabase/ssr";
import { parseCookieHeader } from "@supabase/ssr";

type WritableCookies = {
  set: (name: string, value: string, options: CookieOptions) => void;
};

export function getSupabaseCookies(cookieHeader: string | null) {
  return parseCookieHeader(cookieHeader ?? "")
    .filter((cookie): cookie is { name: string; value: string } => typeof cookie.value === "string")
    .map((cookie) => ({ name: cookie.name, value: cookie.value }));
}

export function setSupabaseCookies(
  target: WritableCookies,
  cookiesToSet: { name: string; value: string; options: CookieOptions }[],
) {
  for (const { name, value, options } of cookiesToSet) {
    target.set(name, value, options);
  }
}
