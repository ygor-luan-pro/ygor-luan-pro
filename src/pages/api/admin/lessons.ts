import type { APIRoute } from 'astro';
import { LessonsService } from '../../../services/lessons.service';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const lessons = await LessonsService.getAllAdmin();
  return new Response(JSON.stringify(lessons), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const body = await request.json() as {
    title?: string;
    slug?: string;
    video_url?: string;
    description?: string | null;
    module_number?: number;
    order_number?: number;
    duration_minutes?: number | null;
    is_published?: boolean;
  };

  if (!body.title || !body.slug || !body.video_url || !body.module_number || !body.order_number) {
    return new Response(
      JSON.stringify({ error: 'title, slug, video_url, module_number e order_number são obrigatórios' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const lesson = await LessonsService.create({
    title: body.title,
    slug: body.slug,
    video_url: body.video_url,
    description: body.description ?? null,
    module_number: body.module_number,
    order_number: body.order_number,
    duration_minutes: body.duration_minutes ?? null,
    thumbnail_url: null,
    is_published: body.is_published ?? false,
  });

  return new Response(JSON.stringify(lesson), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
