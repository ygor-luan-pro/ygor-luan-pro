import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../../src/lib/supabase-admin';
import { resend } from '../../src/lib/resend';
import { POST } from '../../src/pages/api/webhook/cakto';
import { makeCaktoPayload, CAKTO_TEST_SECRET } from '../fixtures/webhooks';

vi.mock('../../src/lib/resend', () => ({
  resend: { emails: { send: vi.fn(() => Promise.resolve({ id: 'email-id' })) } },
  FROM_EMAIL: 'noreply@test.com',
}));

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
  vi.stubEnv('CAKTO_WEBHOOK_SECRET', CAKTO_TEST_SECRET);
});

function mockProvisionPurchase(created = true) {
  vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
    data: { order_id: 'new-order-id', created },
    error: null,
  } as never);
}

describe('POST /api/webhook/cakto', () => {
  describe('secret inválido', () => {
    it('retorna 401 quando secret não está configurado', async () => {
      vi.stubEnv('CAKTO_WEBHOOK_SECRET', '');
      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando secret do payload não bate', async () => {
      const res = await POST(makeCtx(makeCaktoPayload(CAKTO_TEST_SECRET, { secret: 'wrong-secret' })));
      expect(res.status).toBe(401);
    });
  });

  describe('eventos ignorados', () => {
    it('retorna 200 sem ação para eventos que não sejam purchase_approved', async () => {
      const res = await POST(makeCtx(makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'purchase_refused' })));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('retorna 200 sem ação para evento refund', async () => {
      const res = await POST(makeCtx(makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'refund' })));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('email ausente', () => {
    it('retorna 400 quando customer.email está vazio', async () => {
      const payload = makeCaktoPayload();
      (payload.data.customer as Record<string, unknown>).email = '';
      const res = await POST(makeCtx(payload));
      expect(res.status).toBe(400);
    });
  });

  describe('idempotência', () => {
    it('retorna 200 sem enviar email quando order já existe (upsert ignorado)', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(false);

      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(200);
      expect(resend.emails.send).not.toHaveBeenCalled();
    });
  });

  describe('compra aprovada — usuário novo', () => {
    it('cria user, profile, order e envia email com dados Cakto', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(true);

      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'aluno@example.com', email_confirm: true }),
      );
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
        'provision_cakto_purchase',
        expect.objectContaining({
          p_user_id: 'new-user-id',
          p_email: 'aluno@example.com',
          p_payment_id: 'order-test-001',
        }),
      );
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'aluno@example.com' }),
      );
    });

    it('converte amount de centavos para reais no registro da order', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(true);

      await POST(makeCtx(makeCaktoPayload()));

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
        'provision_cakto_purchase',
        expect.objectContaining({ p_amount: 997 }),
      );
    });
  });

  describe('compra aprovada — usuário já existe', () => {
    it('reaproveita userId existente e cria apenas a order', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'already registered', status: 422 },
      } as never);

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null }),
            }),
          }),
        } as never);
      mockProvisionPurchase(false);

      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
        'provision_cakto_purchase',
        expect.objectContaining({ p_user_id: 'existing-user-id' }),
      );
    });
  });

  describe('falha no email', () => {
    it('ainda retorna 200 quando envio de email falha', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(true);
      vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('Resend unavailable'));

      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(200);
    });
  });

  describe('Bug 5 — refund síncrono', () => {
    it('retorna 500 quando OrdersService.updateStatus rejeita no refund', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      } as never);

      const res = await POST(makeCtx(makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'refund' })));
      expect(res.status).toBe(500);
    });
  });

  describe('Bug 2 — profile upsert não sobrescreve role', () => {
    it('não envia role=student na provisão quando profile já existe com role admin', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(false);

      await POST(makeCtx(makeCaktoPayload()));

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
        'provision_cakto_purchase',
        expect.not.objectContaining({ role: 'student' }),
      );
    });
  });

  describe('Bug 3 — detecção de usuário já registrado por status 422', () => {
    it('segue para lookup de profile quando createUser retorna status 422 com mensagem diferente', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'user exists', status: 422 },
      } as never);

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null }),
            }),
          }),
        } as never);
      mockProvisionPurchase(false);

      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
        'provision_cakto_purchase',
        expect.objectContaining({ p_user_id: 'existing-user-id' }),
      );
    });
  });

  describe('Bug 4 — profile lookup com maybeSingle', () => {
    it('retorna 500 quando profile lookup retorna null após createUser "already registered"', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'already registered', status: 422 },
      } as never);

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        } as never);

      const res = await POST(makeCtx(makeCaktoPayload()));
      expect(res.status).toBe(500);
    });
  });

  describe('Bug 1 — sendWelcome idempotente', () => {
    it('não envia email quando RPC marca a compra como já existente', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(false);

      await POST(makeCtx(makeCaktoPayload()));

      expect(resend.emails.send).not.toHaveBeenCalled();
    });

    it('envia email quando RPC marca a compra como nova', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      mockProvisionPurchase(true);

      await POST(makeCtx(makeCaktoPayload()));

      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'aluno@example.com' }),
      );
    });
  });
});
