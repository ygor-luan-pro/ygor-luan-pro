import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../../../types/database.types';
import { validatePassword } from '../../../lib/password-policy';
import { isSameOrigin } from '../../../lib/request-origin';

const RECOVERY_WINDOW_MS = 10 * 60 * 1000;

function isRecoverySession(lastSignInAt: string | undefined): boolean {
  if (!lastSignInAt) return false;
  return Date.now() - new Date(lastSignInAt).getTime() < RECOVERY_WINDOW_MS;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isSameOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origem inválida.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json().catch(() => null) as {
    password?: unknown;
    currentPassword?: unknown;
    isRecovery?: unknown;
  } | null;

  if (!body) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const isRecovery = body.isRecovery === true;

  if (!password) {
    return new Response(JSON.stringify({ error: 'Nova senha obrigatória' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const policy = validatePassword(password, user.email);
  if (!policy.ok) {
    return new Response(JSON.stringify({ error: 'Senha inválida', reasons: policy.reasons }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionIsRecent = isRecoverySession(user.last_sign_in_at ?? undefined);

  if (!isRecovery || !sessionIsRecent) {
    if (!currentPassword) {
      return new Response(JSON.stringify({ error: 'Informe a senha atual para continuar.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email ?? '',
      password: currentPassword,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: 'Senha atual incorreta.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return new Response(JSON.stringify({ error: 'Erro ao atualizar senha.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  void supabase.auth.signOut({ scope: 'others' });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
