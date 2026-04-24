import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('astro:middleware', () => ({
  defineMiddleware: (fn: unknown) => fn,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  parseCookieHeader: vi.fn(() => []),
}));

vi.mock('../../../src/services/users.service', () => ({
  UsersService: { isAdmin: vi.fn() },
}));

vi.mock('../../../src/services/orders.service', () => ({
  OrdersService: { hasActiveAccess: vi.fn() },
}));

vi.mock('../../../src/lib/security-headers', () => ({
  applySecurityHeaders: vi.fn((_res: Response) => _res),
}));

import { UsersService } from '../../../src/services/users.service';
import { OrdersService } from '../../../src/services/orders.service';
import { onRequest } from '../../../src/middleware/index';

const mockUser = { id: 'user-1', email: 'aluno@test.com' };
const mockAdmin = { id: 'admin-1', email: 'admin@test.com' };

function makeCtx(pathname: string) {
  const locals: Record<string, unknown> = {};
  const redirected: string[] = [];
  return {
    url: new URL(`http://localhost${pathname}`),
    request: new Request(`http://localhost${pathname}`),
    cookies: { set: vi.fn(), get: vi.fn(), has: vi.fn() },
    locals,
    redirect: vi.fn((path: string) => {
      redirected.push(path);
      return new Response(null, { status: 302, headers: { Location: path } });
    }),
    _locals: locals,
    _redirected: redirected,
  };
}

const next = vi.fn(() => Promise.resolve(new Response('OK', { status: 200 })));

describe('middleware — rotas públicas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  it('passa direto sem resolver user em rotas públicas', async () => {
    const ctx = makeCtx('/');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(200);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(ctx._locals.user).toBeUndefined();
  });

  it('passa direto em /termos sem resolver user', async () => {
    const ctx = makeCtx('/termos');
    await (onRequest as Function)(ctx, next);
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});

describe('middleware — rotas auth-aware (/login, /redefinir-senha)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  it('resolve user em /login e popula locals.user quando autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const ctx = makeCtx('/login');
    await (onRequest as Function)(ctx, next);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(ctx._locals.user).toEqual(mockUser);
  });

  it('resolve user em /login e locals.user fica null quando não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const ctx = makeCtx('/login');
    await (onRequest as Function)(ctx, next);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(ctx._locals.user).toBeNull();
  });

  it('resolve user em /redefinir-senha e popula locals.user quando autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const ctx = makeCtx('/redefinir-senha');
    await (onRequest as Function)(ctx, next);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(ctx._locals.user).toEqual(mockUser);
  });

  it('NÃO aplica gate de acesso em /login — chama next()', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const ctx = makeCtx('/login');
    await (onRequest as Function)(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(UsersService.isAdmin).not.toHaveBeenCalled();
    expect(OrdersService.hasActiveAccess).not.toHaveBeenCalled();
  });

  it('NÃO aplica gate de acesso em /redefinir-senha — chama next()', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const ctx = makeCtx('/redefinir-senha');
    await (onRequest as Function)(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(UsersService.isAdmin).not.toHaveBeenCalled();
  });
});

describe('middleware — rotas protegidas (sem auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(new Response('OK', { status: 200 }));
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('redireciona /dashboard para /login quando não autenticado', async () => {
    const ctx = makeCtx('/dashboard');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.headers.get('Location')).toBe('/login');
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 em API protegida quando não autenticado', async () => {
    const ctx = makeCtx('/api/progress/complete');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(401);
  });

  it('retorna 401 em /api/lessons quando não autenticado', async () => {
    const ctx = makeCtx('/api/lessons');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(401);
  });
});

describe('middleware — aluno autenticado sem pedido aprovado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(new Response('OK', { status: 200 }));
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    vi.mocked(UsersService.isAdmin).mockResolvedValue(false);
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValue(false);
  });

  it('redireciona /dashboard para /sem-acesso', async () => {
    const ctx = makeCtx('/dashboard');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.headers.get('Location')).toBe('/sem-acesso');
  });

  it('retorna 403 em /api/progress sem acesso', async () => {
    const ctx = makeCtx('/api/progress/complete');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(403);
  });
});

describe('middleware — aluno com acesso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(new Response('OK', { status: 200 }));
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    vi.mocked(UsersService.isAdmin).mockResolvedValue(false);
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValue(true);
  });

  it('passa /dashboard para next()', async () => {
    const ctx = makeCtx('/dashboard');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('seta locals.hasAccess = true', async () => {
    const ctx = makeCtx('/dashboard');
    await (onRequest as Function)(ctx, next);
    expect(ctx._locals.hasAccess).toBe(true);
  });

  it('bloqueia /admin com 302 → /dashboard', async () => {
    const ctx = makeCtx('/admin');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.headers.get('Location')).toBe('/dashboard');
  });
});

describe('middleware — admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(new Response('OK', { status: 200 }));
    mockGetUser.mockResolvedValue({ data: { user: mockAdmin } });
    vi.mocked(UsersService.isAdmin).mockResolvedValue(true);
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValue(false);
  });

  it('admin sem order aprovado ainda acessa /dashboard (hasAccess via isAdmin)', async () => {
    const ctx = makeCtx('/dashboard');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(200);
  });

  it('admin acessa /admin', async () => {
    const ctx = makeCtx('/admin');
    const res = await (onRequest as Function)(ctx, next);
    expect(res.status).toBe(200);
  });

  it('seta locals.isAdmin = true', async () => {
    const ctx = makeCtx('/admin');
    await (onRequest as Function)(ctx, next);
    expect(ctx._locals.isAdmin).toBe(true);
  });
});
