import type { APIRoute } from 'astro';
import { LessonsService } from '../../../../services/lessons.service';
import { EmailService } from '../../../../services/email.service';
import type { Lesson } from '../../../../types';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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

  if (raw.is_published === true) {
    void EmailService.notifyNewLesson(lesson);
  }

  return new Response(JSON.stringify(lesson), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await LessonsService.togglePublish(id, false);
  return new Response(null, { status: 204 });
};
