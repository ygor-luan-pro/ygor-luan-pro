import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignInWithPassword = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { signInWithPassword: mockSignInWithPassword },
  })),
  parseCookieHeader: vi.fn(() => []),
}));

import { POST } from '../../../src/pages/api/auth/login';
import { resetRateLimitStore } from '../../../src/lib/rate-limit';

function makeContext(body: string, ip = '203.0.113.10') {
  const request = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
      Origin: 'http://localhost:4321',
    },
    body,
  });

  return {
    request,
    cookies: { set: vi.fn() },
  } as never;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  it('retorna 400 quando body não é JSON válido', async () => {
    const response = await POST(makeContext('{'));

    expect(response.status).toBe(400);
  });

  it('retorna 400 quando faltam credenciais', async () => {
    const response = await POST(makeContext(JSON.stringify({ email: 'aluno@test.com' })));

    expect(response.status).toBe(400);
  });

  it('retorna 429 após muitas tentativas do mesmo IP', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await POST(makeContext(JSON.stringify({
        email: 'aluno@test.com',
        password: 'senha-errada',
      })));

      expect(response.status).toBe(401);
    }

    const blockedResponse = await POST(makeContext(JSON.stringify({
      email: 'aluno@test.com',
      password: 'senha-errada',
    })));

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get('retry-after')).toBeTruthy();
    expect(mockSignInWithPassword).toHaveBeenCalledTimes(5);
  });
});
