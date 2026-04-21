import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../../../types/database.types';

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { Allow: 'POST' },
  });
}

export const GET: APIRoute = async () => methodNotAllowed();

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => parseCookieHeader(request.headers.get('Cookie') ?? ''),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          for (const { name, value, options } of cookiesToSet) {
            cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.signOut();
  return redirect('/');
};
