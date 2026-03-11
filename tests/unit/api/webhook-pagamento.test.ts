import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/mercadopago', () => ({
  payment: { get: vi.fn() },
}));

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
  FROM_EMAIL: 'noreply@ygorluanpro.com.br',
}));

import { POST } from '../../../src/pages/api/webhook/pagamento';
import { payment as mpPayment } from '../../../src/lib/mercadopago';
import { supabaseAdmin } from '../../../src/lib/supabase';

function buildRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/webhook/pagamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const paymentNotification = {
  type: 'payment',
  data: { id: '12345' },
};

describe('POST /api/webhook/pagamento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', 'test-secret');
  });

  describe('validação de assinatura', () => {
    it('retorna 401 quando MERCADOPAGO_WEBHOOK_SECRET não está configurado', async () => {
      vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '');

      const req = buildRequest(paymentNotification);
      const res = await POST({ request: req } as never);

      expect(res.status).toBe(401);
    });

    it('retorna 401 quando assinatura está ausente', async () => {
      const req = buildRequest(paymentNotification);
      const res = await POST({ request: req } as never);

      expect(res.status).toBe(401);
    });

    it('retorna 401 quando assinatura é inválida', async () => {
      const req = buildRequest(paymentNotification, {
        'x-signature': 'ts=123,v1=invalidsignature',
        'x-request-id': 'req-abc',
      });
      const res = await POST({ request: req } as never);

      expect(res.status).toBe(401);
    });
  });

  describe('idempotência', () => {
    it('retorna 200 sem criar duplicata quando payment_id já existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-order' }, error: null }),
          }),
        }),
      } as never);

      vi.mocked(mpPayment.get).mockResolvedValueOnce({
        status: 'approved',
        id: 12345,
        payer: { email: 'user@example.com' },
        transaction_amount: 997,
        payment_method_id: 'credit_card',
      } as never);

      const createHmac = await import('crypto').then((m) => m.createHmac);
      const template = `id:12345;request-id:req-xyz;ts:1000000;`;
      const v1 = createHmac('sha256', 'test-secret').update(template).digest('hex');

      const req = buildRequest(paymentNotification, {
        'x-signature': `ts=1000000,v1=${v1}`,
        'x-request-id': 'req-xyz',
      });

      const res = await POST({ request: req } as never);

      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).toHaveBeenCalledTimes(1);
    });
  });

  it('retorna 200 para tipo não-payment sem validar assinatura', async () => {
    const req = buildRequest({ type: 'merchant_order', data: { id: '999' } });
    const res = await POST({ request: req } as never);

    expect(res.status).toBe(200);
    expect(mpPayment.get).not.toHaveBeenCalled();
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

      vi.mocked(mpPayment.get).mockResolvedValueOnce({
        status: 'approved',
        id: 12345,
        payer: { email: 'user@example.com' },
        transaction_amount: 997,
        payment_method_id: 'credit_card',
      } as never);

      const createHmac = await import('crypto').then((m) => m.createHmac);
      const template = `id:12345;request-id:req-gen;ts:2000000;`;
      const v1 = createHmac('sha256', 'test-secret').update(template).digest('hex');

      const req = buildRequest(paymentNotification, {
        'x-signature': `ts=2000000,v1=${v1}`,
        'x-request-id': 'req-gen',
      });

      const res = await POST({ request: req } as never);

      expect(res.status).toBe(500);
    });
  });
});
