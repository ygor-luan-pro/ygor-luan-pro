import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        generateLink: vi.fn(),
      },
    },
  },
}));

vi.mock('../../../src/lib/resend', () => ({
  resend: { emails: { send: vi.fn() } },
  FROM_EMAIL: 'noreply@ygorluanacademy.com.br',
}));

import { POST } from '../../../src/pages/api/webhook/cakto';
import { supabaseAdmin } from '../../../src/lib/supabase';

const WEBHOOK_SECRET = 'test-cakto-secret';

function buildRequest(body: unknown): Request {
  return new Request('http://localhost/api/webhook/cakto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    event: 'purchase_approved',
    secret: WEBHOOK_SECRET,
    sentAt: new Date().toISOString(),
    data: {
      id: 'order-test-001',
      refId: 'ref-001',
      status: 'paid',
      amount: 99700,
      paymentMethod: 'credit_card',
      installments: 1,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      customer: {
        name: 'Comprador Teste',
        email: 'user@example.com',
        phone: null,
        docType: null,
        docNumber: null,
      },
      product: { id: 'prod-001', name: 'Mentoria Completa' },
      offer: { id: 'offer-001', name: 'Oferta Principal', price: 99700 },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv('CAKTO_WEBHOOK_SECRET', WEBHOOK_SECRET);
});

describe('POST /api/webhook/cakto', () => {
  describe('validação de secret', () => {
    it('retorna 401 quando CAKTO_WEBHOOK_SECRET não está configurado', async () => {
      vi.stubEnv('CAKTO_WEBHOOK_SECRET', '');
      const res = await POST({ request: buildRequest(makePayload()) } as never);
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando secret do payload é inválido', async () => {
      const res = await POST({
        request: buildRequest(makePayload({ secret: 'wrong-secret' })),
      } as never);
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando comprimentos diferem (bypass de timing-safe)', async () => {
      const res = await POST({
        request: buildRequest(makePayload({ secret: 'short' })),
      } as never);
      expect(res.status).toBe(401);
    });
  });

  describe('eventos ignorados', () => {
    it('retorna 200 sem ação para purchase_refused', async () => {
      const res = await POST({
        request: buildRequest(makePayload({ event: 'purchase_refused' })),
      } as never);
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('retorna 200 sem ação para refund', async () => {
      const res = await POST({
        request: buildRequest(makePayload({ event: 'refund' })),
      } as never);
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('idempotência', () => {
    it('retorna 200 sem criar usuário quando order já existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-order' }, error: null }),
          }),
        }),
      } as never);

      const res = await POST({ request: buildRequest(makePayload()) } as never);
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('falha no generateLink', () => {
    it('retorna 500 quando generateLink falha', async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        } as never)
        .mockReturnValueOnce({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        } as never)
        .mockReturnValueOnce({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        } as never);

      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      vi.mocked(supabaseAdmin.auth.admin.generateLink).mockResolvedValueOnce({
        data: null,
        error: { message: 'link generation failed' },
      } as never);

      const res = await POST({ request: buildRequest(makePayload()) } as never);
      expect(res.status).toBe(500);
    });
  });
});
