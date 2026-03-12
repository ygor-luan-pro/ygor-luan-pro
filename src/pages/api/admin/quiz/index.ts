import type { APIRoute } from 'astro';
import { QuizService } from '../../../../services/quiz.service';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.isAdmin)
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as {
    module_number?: number;
    question?: string;
    options?: unknown;
    correct_answer_index?: number;
    order_number?: number;
  };

  if (!body.module_number || !body.question || !body.options || body.correct_answer_index === undefined)
    return new Response(JSON.stringify({ error: 'module_number, question, options e correct_answer_index são obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  if (!Array.isArray(body.options) || body.options.length !== 4)
    return new Response(JSON.stringify({ error: 'options deve ter exatamente 4 itens' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  if (body.correct_answer_index < 0 || body.correct_answer_index > 3)
    return new Response(JSON.stringify({ error: 'correct_answer_index deve ser entre 0 e 3' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const question = await QuizService.createQuestion({
    module_number: body.module_number,
    question: body.question,
    options: body.options,
    correct_answer_index: body.correct_answer_index,
    order_number: body.order_number ?? 1,
  });
  return new Response(JSON.stringify(question), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
