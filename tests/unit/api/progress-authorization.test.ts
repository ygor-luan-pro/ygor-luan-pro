import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as postWatchTime } from '../../../src/pages/api/progress/watch-time';
import { POST as postComplete } from '../../../src/pages/api/progress/complete';

vi.mock('../../../src/services/progress.service', () => ({
  ProgressService: {
    updateWatchTime: vi.fn().mockResolvedValue(undefined),
    markComplete: vi.fn().mockResolvedValue(undefined),
    getLessonProgress: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../../src/services/certificate.service', () => ({
  CertificateService: {
    isEligible: vi.fn().mockResolvedValue(false),
  },
}));

const mockUser = { id: 'user-1', email: 'aluno@test.com' };

function makeContext(locals: Record<string, unknown>, body: unknown) {
  return {
    request: new Request('http://localhost/api/progress/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    locals,
  } as never;
}

describe('watch-time endpoint — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 quando user e hasAccess estão presentes', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { lessonId: 'lesson-1', watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.status).toBe(200);
  });

  it('retorna 401 quando user é null (não autenticado)', async () => {
    const ctx = makeContext(
      { user: null, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1', watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando user existe mas hasAccess é false (sem compra)', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1', watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando lessonId está ausente', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 401', async () => {
    const ctx = makeContext(
      { user: null, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1', watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1', watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { watchTime: 120 },
    );
    const res = await postWatchTime(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('aceita watchTime=0 como válido e retorna 200', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { lessonId: 'lesson-1', watchTime: 0 },
    );
    const res = await postWatchTime(ctx);
    expect(res.status).toBe(200);
  });
});

describe('complete endpoint — autorização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 quando user e hasAccess estão presentes', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      { lessonId: 'lesson-1' },
    );
    const res = await postComplete(ctx);
    expect(res.status).toBe(200);
  });

  it('retorna 401 quando user é null (não autenticado)', async () => {
    const ctx = makeContext(
      { user: null, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1' },
    );
    const res = await postComplete(ctx);
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando user existe mas hasAccess é false (sem compra)', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1' },
    );
    const res = await postComplete(ctx);
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando lessonId está ausente', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      {},
    );
    const res = await postComplete(ctx);
    expect(res.status).toBe(400);
  });

  it('retorna Content-Type application/json na resposta 401', async () => {
    const ctx = makeContext(
      { user: null, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1' },
    );
    const res = await postComplete(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna Content-Type application/json na resposta 403', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: false },
      { lessonId: 'lesson-1' },
    );
    const res = await postComplete(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('retorna Content-Type application/json na resposta 400', async () => {
    const ctx = makeContext(
      { user: mockUser, isAdmin: false, hasAccess: true },
      {},
    );
    const res = await postComplete(ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});
