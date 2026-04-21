import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/comments.service', () => ({
  CommentsUnavailableError: class CommentsUnavailableError extends Error {
    constructor() {
      super('Comentários indisponíveis no momento');
      this.name = 'CommentsUnavailableError';
    }
  },
  CommentsService: {
    getByLesson: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      id: 'c-1',
      user_id: 'user-1',
      lesson_id: 'lesson-1',
      content: 'Ótima aula!',
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    getOwner: vi.fn().mockResolvedValue('user-1'),
    softDelete: vi.fn().mockResolvedValue(undefined),
    getAllAdmin: vi.fn().mockResolvedValue([]),
  },
}));

import { GET as getComments, POST as postComment } from '../../../src/pages/api/lessons/[id]/comments';
import { DELETE as deleteComment } from '../../../src/pages/api/comments/[id]';
import { GET as getAdminComments } from '../../../src/pages/api/admin/comments';

const mockUser = { id: 'user-1', email: 'aluno@test.com' };
const mockAdmin = { id: 'admin-1', email: 'admin@test.com' };

function makeContext(
  locals: Record<string, unknown>,
  options: { body?: unknown; params?: Record<string, string>; method?: string } = {},
) {
  const { body, params = {}, method } = options;
  const resolvedMethod = method ?? (body !== undefined ? 'POST' : 'GET');
  return {
    request: new Request('http://localhost/api/lessons/lesson-1/comments', {
      method: resolvedMethod,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
    locals,
    params,
  } as never;
}

describe('GET /api/lessons/[id]/comments — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    const ctx = makeContext({ user: undefined, hasAccess: false }, { params: { id: 'lesson-1' } });
    const res = await getComments(ctx);
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando autenticado mas sem acesso', async () => {
    const ctx = makeContext({ user: mockUser, hasAccess: false }, { params: { id: 'lesson-1' } });
    const res = await getComments(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna 200 com lista de comentários quando autenticado com acesso', async () => {
    const ctx = makeContext({ user: mockUser, hasAccess: true }, { params: { id: 'lesson-1' } });
    const res = await getComments(ctx);
    expect(res.status).toBe(200);
    const body = await res.json() as { comments: unknown[] };
    expect(Array.isArray(body.comments)).toBe(true);
  });
});

describe('POST /api/lessons/[id]/comments — validação e autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    const ctx = makeContext({ user: undefined, hasAccess: false }, { body: { content: 'Boa aula!' }, params: { id: 'lesson-1' } });
    const res = await postComment(ctx);
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando autenticado mas sem acesso', async () => {
    const ctx = makeContext({ user: mockUser, hasAccess: false }, { body: { content: 'Boa aula!' }, params: { id: 'lesson-1' } });
    const res = await postComment(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando content está vazio', async () => {
    const ctx = makeContext({ user: mockUser, hasAccess: true }, { body: { content: '   ' }, params: { id: 'lesson-1' } });
    const res = await postComment(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando content ultrapassa 2000 caracteres', async () => {
    const ctx = makeContext(
      { user: mockUser, hasAccess: true },
      { body: { content: 'a'.repeat(2001) }, params: { id: 'lesson-1' } },
    );
    const res = await postComment(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna 201 com o comentário criado quando válido', async () => {
    const ctx = makeContext({ user: mockUser, hasAccess: true }, { body: { content: 'Ótima aula!' }, params: { id: 'lesson-1' } });
    const res = await postComment(ctx);
    expect(res.status).toBe(201);
    const body = await res.json() as { comment: { content: string } };
    expect(body.comment.content).toBe('Ótima aula!');
  });

  it('retorna 503 quando comentários estão indisponíveis', async () => {
    const { CommentsService, CommentsUnavailableError } = await import('../../../src/services/comments.service');
    vi.mocked(CommentsService.create).mockRejectedValueOnce(new CommentsUnavailableError());
    const ctx = makeContext(
      { user: mockUser, hasAccess: true },
      { body: { content: 'Ótima aula!' }, params: { id: 'lesson-1' } },
    );
    const res = await postComment(ctx);
    expect(res.status).toBe(503);
  });
});

describe('DELETE /api/comments/[id] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    const ctx = makeContext({ user: undefined, hasAccess: false, isAdmin: false }, { method: 'DELETE', params: { id: 'c-1' } });
    const res = await deleteComment(ctx);
    expect(res.status).toBe(401);
  });

  it('retorna 404 quando comentário não existe', async () => {
    const { CommentsService } = await import('../../../src/services/comments.service');
    vi.mocked(CommentsService.getOwner).mockResolvedValueOnce(null);
    const ctx = makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { method: 'DELETE', params: { id: 'c-inexistente' } });
    const res = await deleteComment(ctx);
    expect(res.status).toBe(404);
  });

  it('retorna 403 quando aluno tenta deletar comentário de outro', async () => {
    const { CommentsService } = await import('../../../src/services/comments.service');
    vi.mocked(CommentsService.getOwner).mockResolvedValueOnce('outro-user');
    const ctx = makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { method: 'DELETE', params: { id: 'c-1' } });
    const res = await deleteComment(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna 200 quando aluno deleta o próprio comentário', async () => {
    const ctx = makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { method: 'DELETE', params: { id: 'c-1' } });
    const res = await deleteComment(ctx);
    expect(res.status).toBe(200);
  });

  it('retorna 200 quando admin deleta qualquer comentário', async () => {
    const { CommentsService } = await import('../../../src/services/comments.service');
    vi.mocked(CommentsService.getOwner).mockResolvedValueOnce('outro-user');
    const ctx = makeContext({ user: mockAdmin, hasAccess: true, isAdmin: true }, { method: 'DELETE', params: { id: 'c-1' } });
    const res = await deleteComment(ctx);
    expect(res.status).toBe(200);
  });

  it('retorna 503 quando comentários estão indisponíveis ao buscar owner', async () => {
    const { CommentsService, CommentsUnavailableError } = await import('../../../src/services/comments.service');
    vi.mocked(CommentsService.getOwner).mockRejectedValueOnce(new CommentsUnavailableError());
    const ctx = makeContext({ user: mockUser, hasAccess: true, isAdmin: false }, { method: 'DELETE', params: { id: 'c-1' } });
    const res = await deleteComment(ctx);
    expect(res.status).toBe(503);
  });
});

describe('GET /api/admin/comments — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    const ctx = makeContext({ user: undefined, isAdmin: false, hasAccess: false });
    const res = await getAdminComments(ctx);
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando autenticado mas não é admin', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true });
    const res = await getAdminComments(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna 200 com lista de comentários quando é admin', async () => {
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true });
    const res = await getAdminComments(ctx);
    expect(res.status).toBe(200);
    const body = await res.json() as { comments: unknown[] };
    expect(Array.isArray(body.comments)).toBe(true);
  });
});
