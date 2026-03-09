import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../types/database.types';
import { UsersService } from '../services/users.service';

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const ADMIN_PREFIXES = ['/admin'];

export const onRequest = defineMiddleware(async (
  { url, request, cookies, locals, redirect },
  next,
) => {
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

  const { pathname } = url;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return next();

  const { data: { user } } = await supabase.auth.getUser();
  locals.user = user;

  if (!user) return redirect('/login');

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!(await UsersService.isAdmin(user.id))) {
      return redirect('/dashboard');
    }
  }

  return next();
});
