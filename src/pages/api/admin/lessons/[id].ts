import type { APIRoute } from 'astro';
import { LessonsService } from '../../../../services/lessons.service';
import type { Lesson } from '../../../../types';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  const raw = await request.json() as Record<string, unknown>;

  const allowed: (keyof Omit<Lesson, 'id' | 'created_at' | 'updated_at'>)[] = [
    'title', 'slug', 'description', 'video_url', 'thumbnail_url',
    'duration_minutes', 'module_number', 'order_number', 'is_published',
  ];

  const body = Object.fromEntries(
    allowed.filter((k) => k in raw).map((k) => [k, raw[k]]),
  ) as Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>;

  const lesson = await LessonsService.update(id, body);

  return new Response(JSON.stringify(lesson), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  await LessonsService.togglePublish(id, false);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
