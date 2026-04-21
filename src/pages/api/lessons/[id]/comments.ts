import type { APIRoute } from 'astro';
import { CommentsService, CommentsUnavailableError } from '../../../../services/comments.service';

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
    const comments = await CommentsService.getByLesson(lessonId);
    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('comments GET:', err);
    return new Response(JSON.stringify({ error: 'Erro ao buscar comentários' }), {
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
  const body = await request.json() as { content?: unknown };
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (content.length === 0 || content.length > 2000) {
    return new Response(
      JSON.stringify({ error: 'content deve ter entre 1 e 2000 caracteres' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const comment = await CommentsService.create(locals.user.id, lessonId, content);
    return new Response(JSON.stringify({ comment }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof CommentsUnavailableError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('comments POST:', err);
    return new Response(JSON.stringify({ error: 'Erro ao criar comentário' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
