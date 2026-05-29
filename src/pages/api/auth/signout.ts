import { createServerClient } from "@supabase/ssr";
import type { APIRoute } from "astro";
import { getSupabaseCookies, setSupabaseCookies } from "../../../lib/supabase-cookie-bridge";
import type { Database } from "../../../types/database.types";

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export const GET: APIRoute = async () => methodNotAllowed();

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => getSupabaseCookies(request.headers.get("Cookie")),
        setAll: (cookiesToSet) => setSupabaseCookies(cookies, cookiesToSet),
      },
    },
  );

  await supabase.auth.signOut();
  return redirect("/");
};
