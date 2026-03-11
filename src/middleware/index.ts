import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../types/database.types';
import { UsersService } from '../services/users.service';
import { OrdersService } from '../services/orders.service';

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/api/progress'];
const ADMIN_PREFIXES = ['/admin'];
const DASHBOARD_PREFIXES = ['/dashboard'];
const PROGRESS_API_PREFIXES = ['/api/progress'];

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

  const isApiRoute = PROGRESS_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return redirect('/login');
  }

  const [isAdmin, hasAccess] = await Promise.all([
    UsersService.isAdmin(user.id),
    OrdersService.hasActiveAccess(user.id),
  ]);

  locals.isAdmin = isAdmin;
  locals.hasAccess = hasAccess || isAdmin;

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAdmin) return redirect('/dashboard');
  }

  if (DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!locals.hasAccess) return redirect('/sem-acesso');
  }

  if (isApiRoute && !locals.hasAccess) {
    return new Response(JSON.stringify({ error: 'Sem acesso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
});
