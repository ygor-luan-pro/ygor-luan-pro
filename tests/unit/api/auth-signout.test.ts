import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSignOut = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { signOut: mockSignOut },
  })),
  parseCookieHeader: vi.fn(() => []),
}));

const { GET, POST } = await import('../../../src/pages/api/auth/signout');

function makeContext(method: 'GET' | 'POST') {
  const url = new URL('http://localhost/api/auth/signout');
  return {
    request: new Request(url.toString(), { method }),
    cookies: { set: vi.fn() },
    redirect: (path: string) =>
      new Response(null, { status: 302, headers: { Location: path } }),
  } as never;
}

describe('/api/auth/signout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 405 para GET', async () => {
    const res = await GET(makeContext('GET'));
    expect(res.status).toBe(405);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('encerra a sessão no POST e redireciona para /', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    const res = await POST(makeContext('POST'));

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/');
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});
