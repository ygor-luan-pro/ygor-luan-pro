import type { APIRoute } from 'astro';
import { QuizService } from '../../../../services/quiz.service';

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user)
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  if (!locals.hasAccess)
    return new Response(JSON.stringify({ error: 'Sem acesso' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

  const moduleNumber = Number(params.module);
  if (!params.module || isNaN(moduleNumber) || moduleNumber < 1)
    return new Response(JSON.stringify({ error: 'Módulo inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as { answers?: unknown };
  if (!Array.isArray(body.answers))
    return new Response(JSON.stringify({ error: 'answers deve ser um array' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const answers = body.answers as unknown[];
  const validAnswers = answers.every((a) => Number.isInteger(a) && (a as number) >= 0 && (a as number) <= 3);
  if (!validAnswers)
    return new Response(JSON.stringify({ error: 'Cada resposta deve ser um inteiro entre 0 e 3' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await QuizService.submitAttempt(locals.user.id, moduleNumber, answers as number[]);
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
