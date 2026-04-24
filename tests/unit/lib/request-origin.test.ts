import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('isSameOrigin', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('PUBLIC_SITE_URL', 'https://ygorluanpro.com.br');
  });

  it('retorna true quando Origin bate com PUBLIC_SITE_URL', async () => {
    const { isSameOrigin } = await import('../../../src/lib/request-origin');
    const req = new Request('https://ygorluanpro.com.br/api/auth/login', {
      method: 'POST',
      headers: { Origin: 'https://ygorluanpro.com.br' },
    });
    expect(isSameOrigin(req)).toBe(true);
  });

  it('retorna false quando Origin vem de domínio diferente', async () => {
    const { isSameOrigin } = await import('../../../src/lib/request-origin');
    const req = new Request('https://ygorluanpro.com.br/api/auth/login', {
      method: 'POST',
      headers: { Origin: 'https://evil.example.com' },
    });
    expect(isSameOrigin(req)).toBe(false);
  });

  it('retorna false quando Origin está ausente', async () => {
    const { isSameOrigin } = await import('../../../src/lib/request-origin');
    const req = new Request('https://ygorluanpro.com.br/api/auth/login', {
      method: 'POST',
    });
    expect(isSameOrigin(req)).toBe(false);
  });

  it('retorna false quando PUBLIC_SITE_URL não está configurado', async () => {
    vi.stubEnv('PUBLIC_SITE_URL', '');
    const { isSameOrigin } = await import('../../../src/lib/request-origin');
    const req = new Request('https://ygorluanpro.com.br/api/auth/login', {
      method: 'POST',
      headers: { Origin: 'https://ygorluanpro.com.br' },
    });
    expect(isSameOrigin(req)).toBe(false);
  });

  it('ignora porta quando a URL e o Origin têm a mesma origem base', async () => {
    vi.stubEnv('PUBLIC_SITE_URL', 'https://ygorluanpro.com.br');
    const { isSameOrigin } = await import('../../../src/lib/request-origin');
    const req = new Request('https://ygorluanpro.com.br/api/auth/login', {
      method: 'POST',
      headers: { Origin: 'https://ygorluanpro.com.br' },
    });
    expect(isSameOrigin(req)).toBe(true);
  });
});
