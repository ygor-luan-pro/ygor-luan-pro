import type { APIRoute } from 'astro';
import { RatingsService } from '../../../../services/ratings.service';

export const GET: APIRoute = async ({ params, locals }) => {
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

  const lessonId = params.id!;

  try {
    const rating = await RatingsService.getUserLessonRating(locals.user.id, lessonId);
    return new Response(JSON.stringify({ rating }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('rating GET:', err);
    return new Response(JSON.stringify({ error: 'Erro ao buscar avaliação' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
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

  const lessonId = params.id!;
  const body = await request.json() as { rating?: unknown; comment?: unknown };

  const ratingValue = Number(body.rating);
  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return new Response(JSON.stringify({ error: 'rating deve ser um inteiro entre 1 e 5' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const comment = typeof body.comment === 'string' ? body.comment.trim() || undefined : undefined;

  try {
    const rating = await RatingsService.upsertRating(locals.user.id, lessonId, ratingValue, comment);
    return new Response(JSON.stringify({ rating }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('rating POST:', err);
    return new Response(JSON.stringify({ error: 'Erro ao salvar avaliação' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
