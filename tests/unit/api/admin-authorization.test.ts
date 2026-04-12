import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getLessons, POST as postLesson } from '../../../src/pages/api/admin/lessons';
import { PUT as putLesson, DELETE as deleteLesson } from '../../../src/pages/api/admin/lessons/[id]';
import { POST as postMaterial } from '../../../src/pages/api/admin/materials';
import { DELETE as deleteMaterial } from '../../../src/pages/api/admin/materials/[id]';

vi.mock('../../../src/services/lessons.service', () => ({
  LessonsService: {
    getAllAdmin: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'lesson-1', title: 'Aula 1' }),
    getById: vi.fn().mockResolvedValue({ id: 'lesson-1', title: 'Aula 1', is_published: false }),
    update: vi.fn().mockResolvedValue({ id: 'lesson-1', title: 'Aula 1', is_published: false }),
    togglePublish: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/materials.service', () => ({
  MaterialsService: {
    create: vi.fn().mockResolvedValue({ id: 'mat-1', title: 'PDF' }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/email.service', () => ({
  EmailService: {
    notifyNewLesson: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockAdmin = { id: 'admin-1', email: 'admin@test.com' };
const mockUser = { id: 'user-1', email: 'aluno@test.com' };

function makeContext(
  locals: Record<string, unknown>,
  options: { body?: unknown; params?: Record<string, string>; method?: string } = {},
) {
  const { body, params = {}, method } = options;
  const resolvedMethod = method ?? (body !== undefined ? 'POST' : 'GET');
  return {
    request: new Request('http://localhost/api/admin/test', {
      method: resolvedMethod,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
    locals,
    params,
  } as never;
}

describe('GET /api/admin/lessons — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 quando isAdmin é true', async () => {
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true });
    const res = await getLessons(ctx);
    expect(res.status).toBe(200);
  });

  it('retorna 403 quando isAdmin é false (aluno autenticado)', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true });
    const res = await getLessons(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true });
    const res = await getLessons(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('POST /api/admin/lessons — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  const validBody = {
    title: 'Aula 1',
    slug: 'aula-1',
    video_url: 'https://vimeo.com/123',
    module_number: 1,
    order_number: 1,
  };

  it('retorna 201 quando isAdmin é true e body é válido', async () => {
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: validBody });
    const res = await postLesson(ctx);
    expect(res.status).toBe(201);
  });

  it('retorna 403 quando isAdmin é false', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true }, { body: validBody });
    const res = await postLesson(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true }, { body: validBody });
    const res = await postLesson(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna 400 quando isAdmin é true mas body não tem title', async () => {
    const { title: _, ...bodyWithoutTitle } = validBody;
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: bodyWithoutTitle });
    const res = await postLesson(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando isAdmin é true mas body não tem slug', async () => {
    const { slug: _, ...bodyWithoutSlug } = validBody;
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: bodyWithoutSlug });
    const res = await postLesson(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const { title: _, ...bodyWithoutTitle } = validBody;
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: bodyWithoutTitle });
    const res = await postLesson(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('PUT /api/admin/lessons/[id] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 quando isAdmin é true e params.id é válido', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { body: { title: 'Atualizado' }, params: { id: 'lesson-1' }, method: 'PUT' },
    );
    const res = await putLesson(ctx);
    expect(res.status).toBe(200);
  });

  it('retorna 403 quando isAdmin é false', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { body: { title: 'Atualizado' }, params: { id: 'lesson-1' }, method: 'PUT' },
    );
    const res = await putLesson(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { body: { title: 'Atualizado' }, params: { id: 'lesson-1' }, method: 'PUT' },
    );
    const res = await putLesson(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna 400 quando isAdmin é true mas params.id está ausente', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { body: { title: 'Atualizado' }, params: {}, method: 'PUT' },
    );
    const res = await putLesson(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { body: { title: 'Atualizado' }, params: {}, method: 'PUT' },
    );
    const res = await putLesson(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('DELETE /api/admin/lessons/[id] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 204 quando isAdmin é true e params.id é válido', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { params: { id: 'lesson-1' }, method: 'DELETE' },
    );
    const res = await deleteLesson(ctx);
    expect(res.status).toBe(204);
  });

  it('retorna 403 quando isAdmin é false', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { params: { id: 'lesson-1' }, method: 'DELETE' },
    );
    const res = await deleteLesson(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { params: { id: 'lesson-1' }, method: 'DELETE' },
    );
    const res = await deleteLesson(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna 400 quando isAdmin é true mas params.id está ausente', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { params: {}, method: 'DELETE' },
    );
    const res = await deleteLesson(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { params: {}, method: 'DELETE' },
    );
    const res = await deleteLesson(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('POST /api/admin/materials — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  const validBody = {
    lesson_id: 'lesson-1',
    title: 'PDF de apoio',
    file_url: 'materials/lesson-1/arquivo.pdf',
  };

  it('retorna 201 quando isAdmin é true e body é válido', async () => {
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: validBody });
    const res = await postMaterial(ctx);
    expect(res.status).toBe(201);
  });

  it('retorna 403 quando isAdmin é false', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true }, { body: validBody });
    const res = await postMaterial(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext({ user: mockUser, isAdmin: false, hasAccess: true }, { body: validBody });
    const res = await postMaterial(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna 400 quando isAdmin é true mas body não tem title', async () => {
    const { title: _, ...bodyWithoutTitle } = validBody;
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: bodyWithoutTitle });
    const res = await postMaterial(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando isAdmin é true mas body não tem lesson_id', async () => {
    const { lesson_id: _, ...bodyWithoutLessonId } = validBody;
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: bodyWithoutLessonId });
    const res = await postMaterial(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const { title: _, ...bodyWithoutTitle } = validBody;
    const ctx = makeContext({ user: mockAdmin, isAdmin: true, hasAccess: true }, { body: bodyWithoutTitle });
    const res = await postMaterial(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('DELETE /api/admin/materials/[id] — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 204 quando isAdmin é true e params.id é válido', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { params: { id: 'mat-1' }, method: 'DELETE' },
    );
    const res = await deleteMaterial(ctx);
    expect(res.status).toBe(204);
  });

  it('retorna 403 quando isAdmin é false', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { params: { id: 'mat-1' }, method: 'DELETE' },
    );
    const res = await deleteMaterial(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { params: { id: 'mat-1' }, method: 'DELETE' },
    );
    const res = await deleteMaterial(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna 400 quando isAdmin é true mas params.id está ausente', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { params: {}, method: 'DELETE' },
    );
    const res = await deleteMaterial(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const ctx = makeContext(
      { user: mockAdmin, isAdmin: true, hasAccess: true },
      { params: {}, method: 'DELETE' },
    );
    const res = await deleteMaterial(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});
