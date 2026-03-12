import type { APIRoute } from 'astro';
import { QuizService } from '../../../../services/quiz.service';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.isAdmin)
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  if (!params.id)
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as Record<string, unknown>;
  const question = await QuizService.updateQuestion(params.id, body);
  return new Response(JSON.stringify(question), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.isAdmin)
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  if (!params.id)
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  await QuizService.deleteQuestion(params.id);
  return new Response(null, { status: 204 });
};
