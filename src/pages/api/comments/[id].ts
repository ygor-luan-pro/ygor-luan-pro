import type { APIRoute } from 'astro';
import { CommentsService, CommentsUnavailableError } from '../../../services/comments.service';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!locals.hasAccess && !locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Sem acesso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const commentId = params.id!;

  try {
    const ownerId = await CommentsService.getOwner(commentId);

    if (!ownerId) {
      return new Response(JSON.stringify({ error: 'Comentário não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (ownerId !== locals.user.id && !locals.isAdmin) {
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await CommentsService.softDelete(commentId);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof CommentsUnavailableError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('comments DELETE:', err);
    return new Response(JSON.stringify({ error: 'Erro ao deletar comentário' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
