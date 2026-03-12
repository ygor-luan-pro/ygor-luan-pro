import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getQuestions } from '../../../src/pages/api/quiz/[module]';
import { POST as submitQuiz } from '../../../src/pages/api/quiz/[module]/submit';
import { POST as adminCreateQuestion } from '../../../src/pages/api/admin/quiz/index';
import { PUT as adminUpdateQuestion, DELETE as adminDeleteQuestion } from '../../../src/pages/api/admin/quiz/[id]';

vi.mock('../../../src/services/quiz.service', () => ({
  QuizService: {
    getPublicQuestionsByModule: vi.fn().mockResolvedValue([]),
    submitAttempt: vi.fn().mockResolvedValue({ score: 1, total: 1, correctIndices: [0] }),
    getBestAttempt: vi.fn().mockResolvedValue(null),
    createQuestion: vi.fn().mockResolvedValue({ id: 'q-1' }),
    updateQuestion: vi.fn().mockResolvedValue({ id: 'q-1' }),
    deleteQuestion: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockUser = { id: 'user-1', email: 'aluno@test.com' };

function makeContext(locals: Record<string, unknown>, body: unknown = null, params: Record<string, string> = { module: '1' }) {
  return {
    request: new Request('http://localhost/api/quiz/1', {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),
    locals,
    params,
  } as never;
}

describe('GET /api/quiz/[module] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());
  it('retorna 200 quando aluno tem acesso', async () => {
    const res = await getQuestions(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }));
    expect(res.status).toBe(200);
  });
  it('retorna 401 quando não autenticado', async () => {
    const res = await getQuestions(makeContext({ user: null, hasAccess: false, isAdmin: false }));
    expect(res.status).toBe(401);
  });
  it('retorna 403 quando autenticado sem acesso', async () => {
    const res = await getQuestions(makeContext({ user: mockUser, hasAccess: false, isAdmin: false }));
    expect(res.status).toBe(403);
  });
  it('retorna 400 quando module param não é número válido', async () => {
    const res = await getQuestions(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, null, { module: 'abc' }));
    expect(res.status).toBe(400);
  });
  it('retorna Content-Type application/json em todos os casos', async () => {
    const res = await getQuestions(makeContext({ user: null, hasAccess: false, isAdmin: false }));
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('POST /api/quiz/[module]/submit — autorização', () => {
  beforeEach(() => vi.clearAllMocks());
  it('retorna 200 quando aluno envia respostas válidas', async () => {
    const res = await submitQuiz(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { answers: [0] }));
    expect(res.status).toBe(200);
  });
  it('retorna 401 quando não autenticado', async () => {
    const res = await submitQuiz(makeContext({ user: null, hasAccess: false, isAdmin: false }, { answers: [0] }));
    expect(res.status).toBe(401);
  });
  it('retorna 403 quando autenticado sem acesso', async () => {
    const res = await submitQuiz(makeContext({ user: mockUser, hasAccess: false, isAdmin: false }, { answers: [0] }));
    expect(res.status).toBe(403);
  });
  it('retorna 400 quando answers está ausente', async () => {
    const res = await submitQuiz(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, {}));
    expect(res.status).toBe(400);
  });
  it('retorna 400 quando answers não é array', async () => {
    const res = await submitQuiz(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { answers: 'errado' }));
    expect(res.status).toBe(400);
  });
  it('retorna 400 quando answers contém valor fora de 0–3', async () => {
    const res = await submitQuiz(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { answers: [0, 5, -1] }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/quiz — autorização', () => {
  beforeEach(() => vi.clearAllMocks());
  it('retorna 201 quando admin cria questão válida', async () => {
    const res = await adminCreateQuestion(makeContext(
      { user: mockUser, hasAccess: true, isAdmin: true },
      { module_number: 1, question: 'Pergunta?', options: ['A','B','C','D'], correct_answer_index: 0, order_number: 1 },
      {},
    ));
    expect(res.status).toBe(201);
  });
  it('retorna 403 quando não é admin', async () => {
    const res = await adminCreateQuestion(makeContext(
      { user: mockUser, hasAccess: true, isAdmin: false },
      { module_number: 1, question: 'x', options: ['a','b','c','d'], correct_answer_index: 0, order_number: 1 },
      {},
    ));
    expect(res.status).toBe(403);
  });
  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const res = await adminCreateQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: true }, { module_number: 1 }, {}));
    expect(res.status).toBe(400);
  });
  it('retorna 400 quando options não tem exatamente 4 itens', async () => {
    const res = await adminCreateQuestion(makeContext(
      { user: mockUser, hasAccess: true, isAdmin: true },
      { module_number: 1, question: 'x', options: ['a','b'], correct_answer_index: 0, order_number: 1 },
      {},
    ));
    expect(res.status).toBe(400);
  });
  it('retorna 400 quando correct_answer_index está fora de 0–3', async () => {
    const res = await adminCreateQuestion(makeContext(
      { user: mockUser, hasAccess: true, isAdmin: true },
      { module_number: 1, question: 'x', options: ['a','b','c','d'], correct_answer_index: 5, order_number: 1 },
      {},
    ));
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/admin/quiz/[id] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());
  it('retorna 200 quando admin atualiza questão', async () => {
    const res = await adminUpdateQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: true }, { question: 'x' }, { id: 'q-1' }));
    expect(res.status).toBe(200);
  });
  it('retorna 403 quando não é admin', async () => {
    const res = await adminUpdateQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { question: 'x' }, { id: 'q-1' }));
    expect(res.status).toBe(403);
  });
  it('retorna 400 quando id está ausente', async () => {
    const res = await adminUpdateQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: true }, { question: 'x' }, {}));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/admin/quiz/[id] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());
  it('retorna 204 quando admin deleta questão', async () => {
    const res = await adminDeleteQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: true }, null, { id: 'q-1' }));
    expect(res.status).toBe(204);
  });
  it('retorna 403 quando não é admin', async () => {
    const res = await adminDeleteQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, null, { id: 'q-1' }));
    expect(res.status).toBe(403);
  });
  it('retorna 400 quando id está ausente', async () => {
    const res = await adminDeleteQuestion(makeContext({ user: mockUser, hasAccess: true, isAdmin: true }, null, {}));
    expect(res.status).toBe(400);
  });
});
