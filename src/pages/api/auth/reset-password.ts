import type { APIRoute } from 'astro';
import { AuthService } from '../../../services/auth.service';

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json() as { email?: string };

  if (!email) {
    return new Response(JSON.stringify({ error: 'E-mail obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await AuthService.resetPassword(email);
  } catch (err) {
    console.error('reset-password: erro interno', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
