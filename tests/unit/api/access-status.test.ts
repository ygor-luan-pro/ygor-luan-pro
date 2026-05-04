import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetLatestByUserId, mockHasActiveAccess } = vi.hoisted(() => ({
  mockGetLatestByUserId: vi.fn(),
  mockHasActiveAccess: vi.fn(),
}));

vi.mock('../../../src/services/orders.service', () => ({
  OrdersService: {
    getLatestByUserId: mockGetLatestByUserId,
    hasActiveAccess: mockHasActiveAccess,
  },
}));

import { GET } from '../../../src/pages/api/auth/access-status';

const mockUser = { id: 'user-1', email: 'aluno@test.com' };

function makeContext(locals: Record<string, unknown>) {
  return {
    request: new Request('http://localhost/api/auth/access-status', { method: 'GET' }),
    locals,
  } as never;
}

describe('GET /api/auth/access-status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando não há usuário autenticado', async () => {
    const ctx = makeContext({ user: null });
    const res = await GET(ctx);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Não autenticado');
  });

  it('retorna 200 com hasAccess=false e lastOrder=null quando usuário não tem pedido', async () => {
    mockHasActiveAccess.mockResolvedValue(false);
    mockGetLatestByUserId.mockResolvedValue(null);
    const ctx = makeContext({ user: mockUser });
    const res = await GET(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasAccess).toBe(false);
    expect(body.lastOrder).toBeNull();
  });

  it('retorna 200 com hasAccess=false para pedido pending', async () => {
    const createdAt = new Date().toISOString();
    mockHasActiveAccess.mockResolvedValue(false);
    mockGetLatestByUserId.mockResolvedValue({
      id: 'order-1',
      user_id: 'user-1',
      payment_id: 'pay-1',
      status: 'pending',
      amount: 99700,
      payment_method: 'pix',
      created_at: createdAt,
      approved_at: null,
    });
    const ctx = makeContext({ user: mockUser });
    const res = await GET(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasAccess).toBe(false);
    expect(body.lastOrder).toEqual({ status: 'pending', created_at: createdAt });
  });

  it('retorna 200 com hasAccess=true para pedido approved', async () => {
    const createdAt = new Date().toISOString();
    mockHasActiveAccess.mockResolvedValue(true);
    mockGetLatestByUserId.mockResolvedValue({
      id: 'order-2',
      user_id: 'user-1',
      payment_id: 'pay-2',
      status: 'approved',
      amount: 99700,
      payment_method: 'pix',
      created_at: createdAt,
      approved_at: createdAt,
    });
    const ctx = makeContext({ user: mockUser });
    const res = await GET(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasAccess).toBe(true);
    expect(body.lastOrder).toEqual({ status: 'approved', created_at: createdAt });
  });
});
