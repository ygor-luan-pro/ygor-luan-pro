import { createServerClient } from "@supabase/ssr";
import type { APIRoute } from "astro";
import { resolveCallbackRedirect } from "../../lib/auth-navigation";
import { getSupabaseCookies, setSupabaseCookies } from "../../lib/supabase-cookie-bridge";

export const GET: APIRoute = async ({ url, request, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (!code) return redirect("/login");

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => getSupabaseCookies(request.headers.get("Cookie")),
        setAll: (cookiesToSet) => setSupabaseCookies(cookies, cookiesToSet),
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return redirect("/login");

  return redirect(resolveCallbackRedirect(next));
};
