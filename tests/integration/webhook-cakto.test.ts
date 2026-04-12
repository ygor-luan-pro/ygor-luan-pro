import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../../src/lib/supabase-admin';
import { resend } from '../../src/lib/resend';
import { POST } from '../../src/pages/api/webhook/cakto';

vi.mock('../../src/lib/resend', () => ({
  resend: { emails: { send: vi.fn(() => Promise.resolve({ id: 'email-id' })) } },
  FROM_EMAIL: 'noreply@test.com',
}));

const WEBHOOK_SECRET = 'cakto-secret-test';

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    event: 'purchase_approved',
    secret: WEBHOOK_SECRET,
    sentAt: new Date().toISOString(),
    data: {
      id: 'order-abc-123',
      refId: 'ref-001',
      status: 'paid',
      amount: 99700,
      paymentMethod: 'credit_card',
      installments: 1,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      customer: {
        name: 'Comprador Teste',
        email: 'comprador@email.com',
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

function makeCtx(payload: unknown) {
  return {
    request: new Request('http://localhost/api/webhook/cakto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  } as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv('CAKTO_WEBHOOK_SECRET', WEBHOOK_SECRET);
});

describe('POST /api/webhook/cakto', () => {
  describe('secret inválido', () => {
    it('retorna 401 quando secret não está configurado', async () => {
      vi.stubEnv('CAKTO_WEBHOOK_SECRET', '');
      const res = await POST(makeCtx(makePayload()));
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando secret do payload não bate', async () => {
      const res = await POST(makeCtx(makePayload({ secret: 'wrong-secret' })));
      expect(res.status).toBe(401);
    });
  });

  describe('eventos ignorados', () => {
    it('retorna 200 sem ação para eventos que não sejam purchase_approved', async () => {
      const res = await POST(makeCtx(makePayload({ event: 'purchase_refused' })));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('retorna 200 sem ação para evento refund', async () => {
      const res = await POST(makeCtx(makePayload({ event: 'refund' })));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('email ausente', () => {
    it('retorna 400 quando customer.email está vazio', async () => {
      const payload = makePayload();
      (payload.data.customer as Record<string, unknown>).email = '';
      const res = await POST(makeCtx(payload));
      expect(res.status).toBe(400);
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

      const res = await POST(makeCtx(makePayload()));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('compra aprovada — usuário novo', () => {
    it('cria user, profile, order e envia email com dados Cakto', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);

      const res = await POST(makeCtx(makePayload()));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'comprador@email.com', email_confirm: true }),
      );
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('orders');
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'comprador@email.com' }),
      );
    });

    it('converte amount de centavos para reais no registro da order', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);

      await POST(makeCtx(makePayload()));

      const ordersFromIndex = vi.mocked(supabaseAdmin.from).mock.calls.findLastIndex(
        ([table]: [string]) => table === 'orders',
      );
      expect(ordersFromIndex).toBeGreaterThanOrEqual(0);

      const ordersInstance = vi.mocked(supabaseAdmin.from).mock.results[ordersFromIndex]
        ?.value as { upsert: ReturnType<typeof vi.fn> };
      expect(ordersInstance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 997 }),
        expect.any(Object),
      );
    });
  });

  describe('compra aprovada — usuário já existe', () => {
    it('reaproveita userId existente e cria apenas a order', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'already registered' },
      } as never);

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null }),
          }),
        }),
      } as never);

      const res = await POST(makeCtx(makePayload()));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });

  describe('falha no email', () => {
    it('ainda retorna 200 quando envio de email falha', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('Resend unavailable'));

      const res = await POST(makeCtx(makePayload()));
      expect(res.status).toBe(200);
    });
  });
});
