import type { APIRoute } from 'astro';
import { ProgressService } from '../../../services/progress.service';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!locals.hasAccess) {
    return new Response(JSON.stringify({ error: 'Sem acesso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { lessonId, watchTime } = await request.json() as {
    lessonId?: string;
    watchTime?: number;
  };

  if (!lessonId || watchTime === undefined) {
    return new Response(JSON.stringify({ error: 'lessonId e watchTime obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await ProgressService.updateWatchTime(locals.user.id, lessonId, watchTime);
  } catch (err) {
    console.error('progress/watch-time:', err);
    return new Response(JSON.stringify({ error: 'Erro ao salvar progresso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
