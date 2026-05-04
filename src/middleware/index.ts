import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../types/database.types';
import { UsersService } from '../services/users.service';
import { OrdersService } from '../services/orders.service';
import { applySecurityHeaders } from '../lib/security-headers';
import { isSameOrigin } from '../lib/request-origin';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/api/progress', '/api/admin', '/api/quiz', '/api/lessons', '/api/comments'];
const ADMIN_PREFIXES = ['/admin', '/api/admin'];
const DASHBOARD_PREFIXES = ['/dashboard'];
const API_PREFIXES = ['/api/progress', '/api/admin', '/api/quiz', '/api/lessons', '/api/comments'];
const AUTH_AWARE_PREFIXES = ['/login', '/redefinir-senha', '/api/auth/access-status'];

export const onRequest = defineMiddleware(async (
  { url, request, cookies, locals, redirect },
  next,
) => {
  const respond = (response: Response) => applySecurityHeaders(response, url);
  const { pathname } = url;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthAware = AUTH_AWARE_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthAware) {
    return respond(await next());
  }

  const isApiPath = API_PREFIXES.some((p) => pathname.startsWith(p));
  if (isApiPath && MUTATING_METHODS.includes(request.method) && !isSameOrigin(request)) {
    return respond(new Response(JSON.stringify({ error: 'Origem inválida' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => parseCookieHeader(request.headers.get('Cookie') ?? ''),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookies.set(name, value, options);
            } catch {
              // _emitInitialSession fires via setTimeout after response is sent; ignore
            }
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  locals.user = user;

  if (isAuthAware && !isProtected) {
    return respond(await next());
  }

  const isApiRoute = API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user) {
    if (isApiRoute) {
      return respond(new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    const nextTarget = encodeURIComponent(pathname + url.search);
    return respond(redirect(`/login?next=${nextTarget}`));
  }

  const [isAdmin, hasAccess] = await Promise.all([
    UsersService.isAdmin(user.id),
    OrdersService.hasActiveAccess(user.id),
  ]);

  locals.isAdmin = isAdmin;
  locals.hasAccess = hasAccess || isAdmin;

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAdmin) {
      if (isApiRoute) {
        return respond(new Response(JSON.stringify({ error: 'Acesso negado' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return respond(redirect('/dashboard'));
    }
  }

  if (DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!locals.hasAccess) return respond(redirect('/sem-acesso'));
  }

  if (isApiRoute && !locals.hasAccess) {
    return respond(new Response(JSON.stringify({ error: 'Sem acesso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  return respond(await next());
});
