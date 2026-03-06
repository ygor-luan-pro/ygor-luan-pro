import { createHmac } from 'crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../../src/lib/supabase';
import { payment } from '../../src/lib/mercadopago';
import { resend } from '../../src/lib/resend';
import { POST } from '../../src/pages/api/webhook/pagamento';

vi.mock('../../src/lib/mercadopago', () => ({
  payment: { get: vi.fn() },
  preference: { create: vi.fn() },
}));

vi.mock('../../src/lib/resend', () => ({
  resend: { emails: { send: vi.fn(() => Promise.resolve({ id: 'email-id' })) } },
  FROM_EMAIL: 'noreply@test.com',
}));

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/webhook/pagamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function makeCtx(body: unknown, headers: Record<string, string> = {}) {
  return { request: makeRequest(body, headers) } as Parameters<typeof POST>[0];
}

const APPROVED_PAYMENT = {
  id: 123,
  status: 'approved',
  transaction_amount: 997,
  payment_method_id: 'credit_card',
  payer: { email: 'comprador@email.com', first_name: null, last_name: null },
};

function buildValidSignature(paymentId: string, secret: string) {
  const ts = String(Date.now());
  const requestId = 'req-001';
  const template = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', secret).update(template).digest('hex');
  return {
    'x-signature': `ts=${ts},v1=${v1}`,
    'x-request-id': requestId,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('POST /api/webhook/pagamento', () => {
  describe('tipo != payment', () => {
    it('retorna 200 sem executar nenhuma ação', async () => {
      const res = await POST(makeCtx({ type: 'merchant_order', data: { id: '1' } }));
      expect(res.status).toBe(200);
      expect(payment.get).not.toHaveBeenCalled();
    });
  });

  describe('pagamento não aprovado', () => {
    it('retorna 200 sem criar usuário', async () => {
      vi.mocked(payment.get).mockResolvedValueOnce({
        ...APPROVED_PAYMENT,
        status: 'pending',
      } as never);

      const res = await POST(makeCtx({ type: 'payment', data: { id: '1' } }));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('email ausente no pagador', () => {
    it('retorna 400', async () => {
      vi.mocked(payment.get).mockResolvedValueOnce({
        ...APPROVED_PAYMENT,
        payer: { email: null },
      } as never);

      const res = await POST(makeCtx({ type: 'payment', data: { id: '1' } }));
      expect(res.status).toBe(400);
    });
  });

  describe('idempotência', () => {
    it('retorna 200 sem criar usuário quando order já existe', async () => {
      vi.mocked(payment.get).mockResolvedValueOnce(APPROVED_PAYMENT as never);

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-order' }, error: null }),
          }),
        }),
      } as never);

      const res = await POST(makeCtx({ type: 'payment', data: { id: '123' } }));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('usuário novo', () => {
    it('cria user, profile, order e envia email', async () => {
      vi.mocked(payment.get).mockResolvedValueOnce(APPROVED_PAYMENT as never);
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);

      const res = await POST(makeCtx({ type: 'payment', data: { id: '123' } }));
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
  });

  describe('usuário já existe', () => {
    it('reaproveita userId existente e cria apenas a order', async () => {
      vi.mocked(payment.get).mockResolvedValueOnce(APPROVED_PAYMENT as never);
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'already registered' },
      } as never);

      // First from call: orders check → no existing order
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);

      // Second from call: profiles lookup → existing user
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null }),
          }),
        }),
      } as never);

      const res = await POST(makeCtx({ type: 'payment', data: { id: '123' } }));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });

  describe('Resend falha', () => {
    it('ainda retorna 200 quando envio de email lança exceção', async () => {
      vi.mocked(payment.get).mockResolvedValueOnce(APPROVED_PAYMENT as never);
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id' } },
        error: null,
      } as never);
      vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('Resend unavailable'));

      const res = await POST(makeCtx({ type: 'payment', data: { id: '123' } }));
      expect(res.status).toBe(200);
    });
  });

  describe('verificação de assinatura', () => {
    it('retorna 401 quando secret está definido e assinatura é inválida', async () => {
      vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', 'real-secret');

      const res = await POST(
        makeCtx({ type: 'payment', data: { id: '123' } }, {
          'x-signature': 'ts=12345,v1=invalidsignature',
          'x-request-id': 'req-001',
        }),
      );
      expect(res.status).toBe(401);
    });

    it('processa normalmente quando MERCADOPAGO_WEBHOOK_SECRET não está definido', async () => {
      vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '');
      vi.mocked(payment.get).mockResolvedValueOnce({
        ...APPROVED_PAYMENT,
        status: 'pending',
      } as never);

      const res = await POST(makeCtx({ type: 'payment', data: { id: '1' } }));
      expect(res.status).toBe(200);
      expect(payment.get).toHaveBeenCalled();
    });

    it('processa normalmente quando assinatura é válida', async () => {
      const secret = 'real-secret';
      vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', secret);
      vi.mocked(payment.get).mockResolvedValueOnce({
        ...APPROVED_PAYMENT,
        status: 'pending',
      } as never);

      const headers = buildValidSignature('123', secret);
      const res = await POST(makeCtx({ type: 'payment', data: { id: '123' } }, headers));
      expect(res.status).toBe(200);
    });
  });
});
