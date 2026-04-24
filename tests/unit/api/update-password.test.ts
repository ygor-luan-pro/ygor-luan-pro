import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  })),
  parseCookieHeader: vi.fn(() => []),
}));

import { POST } from '../../../src/pages/api/auth/update-password';

const mockUser = {
  id: 'user-1',
  email: 'aluno@test.com',
  last_sign_in_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
};

const mockUserOldSession = {
  id: 'user-1',
  email: 'aluno@test.com',
  last_sign_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
};

function makeCtx(body: unknown, cookies?: Record<string, string>) {
  return {
    request: new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: '', Origin: 'http://localhost:4321' },
      body: JSON.stringify(body),
    }),
    cookies: {
      set: vi.fn(),
      get: vi.fn((name: string) => cookies?.[name]),
    },
  } as never;
}

describe('POST /api/auth/update-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autenticação', () => {
    it('retorna 401 quando não há sessão ativa', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const res = await POST(makeCtx({ password: 'NovaSenh@1', isRecovery: true }));
      expect(res.status).toBe(401);
    });
  });

  describe('validação de body', () => {
    it('retorna 400 quando body não é JSON válido', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      const ctx = {
        request: new Request('http://localhost/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: '', Origin: 'http://localhost:4321' },
          body: '{invalid',
        }),
        cookies: { set: vi.fn(), get: vi.fn() },
      } as never;
      const res = await POST(ctx);
      expect(res.status).toBe(400);
    });

    it('retorna 400 quando password está ausente', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      const res = await POST(makeCtx({ isRecovery: true }));
      expect(res.status).toBe(400);
    });
  });

  describe('política de senha', () => {
    it('retorna 422 quando senha viola a política (menos de 8 chars)', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      const res = await POST(makeCtx({ password: 'curta', isRecovery: true }));
      expect(res.status).toBe(422);
      const body = await res.json() as { reasons: string[] };
      expect(body.reasons).toBeDefined();
      expect(body.reasons.length).toBeGreaterThan(0);
    });

    it('retorna 422 quando senha está na lista de senhas comuns', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      const res = await POST(makeCtx({ password: '12345678', isRecovery: true }));
      expect(res.status).toBe(422);
    });
  });

  describe('fluxo recovery (sessão recente ≤10min)', () => {
    it('atualiza senha sem exigir senha atual', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockUpdateUser.mockResolvedValue({ error: null });
      mockSignOut.mockResolvedValue({ error: null });

      const res = await POST(makeCtx({ password: 'NovaSenh@123', isRecovery: true }));
      expect(res.status).toBe(200);
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NovaSenh@123' });
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'others' });
    });

    it('não chama signInWithPassword no fluxo recovery', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockUpdateUser.mockResolvedValue({ error: null });
      mockSignOut.mockResolvedValue({ error: null });

      await POST(makeCtx({ password: 'NovaSenh@123', isRecovery: true }));
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('fluxo autenticado comum (sessão antiga >10min ou isRecovery=false)', () => {
    it('exige currentPassword quando sessão é antiga', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUserOldSession } });
      const res = await POST(makeCtx({ password: 'NovaSenh@123', isRecovery: false }));
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toMatch(/senha atual/i);
    });

    it('retorna 401 quando currentPassword está errada', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUserOldSession } });
      mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });

      const res = await POST(makeCtx({
        password: 'NovaSenh@123',
        currentPassword: 'errada',
        isRecovery: false,
      }));
      expect(res.status).toBe(401);
    });

    it('atualiza senha quando currentPassword está correta', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUserOldSession } });
      mockSignInWithPassword.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });
      mockSignOut.mockResolvedValue({ error: null });

      const res = await POST(makeCtx({
        password: 'NovaSenh@123',
        currentPassword: 'SenhaAtual!1',
        isRecovery: false,
      }));
      expect(res.status).toBe(200);
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NovaSenh@123' });
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'others' });
    });
  });

  describe('erro do Supabase', () => {
    it('retorna 500 quando updateUser falha', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockUpdateUser.mockResolvedValue({ error: { message: 'DB error' } });

      const res = await POST(makeCtx({ password: 'NovaSenh@123', isRecovery: true }));
      expect(res.status).toBe(500);
    });
  });
});
