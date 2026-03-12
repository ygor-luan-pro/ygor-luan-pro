import type { APIRoute } from 'astro';
import { QuizService } from '../../../../services/quiz.service';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.isAdmin)
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  if (!params.id)
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as {
    options?: unknown;
    correct_answer_index?: unknown;
    [key: string]: unknown;
  };

  if (body.options !== undefined && (!Array.isArray(body.options) || body.options.length !== 4))
    return new Response(JSON.stringify({ error: 'options deve ter exatamente 4 itens' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  if (body.correct_answer_index !== undefined) {
    const idx = body.correct_answer_index;
    if (!Number.isInteger(idx) || (idx as number) < 0 || (idx as number) > 3)
      return new Response(JSON.stringify({ error: 'correct_answer_index deve ser entre 0 e 3' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const question = await QuizService.updateQuestion(params.id, body as Parameters<typeof QuizService.updateQuestion>[1]);
    return new Response(JSON.stringify(question), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.isAdmin)
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  if (!params.id)
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    await QuizService.deleteQuestion(params.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
