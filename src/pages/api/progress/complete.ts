import type { APIRoute } from 'astro';
import { ProgressService } from '../../../services/progress.service';
import { OrdersService } from '../../../services/orders.service';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  const hasAccess = await OrdersService.hasActiveAccess(locals.user.id);
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'Sem acesso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { lessonId } = await request.json() as { lessonId?: string };

  if (!lessonId) {
    return new Response(JSON.stringify({ error: 'lessonId obrigatório' }), { status: 400 });
  }

  await ProgressService.markComplete(locals.user.id, lessonId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
