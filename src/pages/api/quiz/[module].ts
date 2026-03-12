import type { APIRoute } from 'astro';
import { QuizService } from '../../../services/quiz.service';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user)
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  if (!locals.hasAccess)
    return new Response(JSON.stringify({ error: 'Sem acesso' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

  const moduleNumber = Number(params.module);
  if (!params.module || isNaN(moduleNumber) || moduleNumber < 1)
    return new Response(JSON.stringify({ error: 'Módulo inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const [questions, bestAttempt] = await Promise.all([
      QuizService.getPublicQuestionsByModule(moduleNumber),
      QuizService.getBestAttempt(locals.user.id, moduleNumber),
    ]);
    return new Response(JSON.stringify({ questions, bestAttempt }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
