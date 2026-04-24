import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeCaktoPayload, CAKTO_TEST_SECRET } from '../../fixtures/webhooks';
import { resetRateLimitStore } from '../../../src/lib/rate-limit';

vi.mock('../../../src/lib/supabase-admin', () => ({
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

vi.mock('../../../src/services/orders.service', () => ({
  OrdersService: {
    updateStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

import { POST } from '../../../src/pages/api/webhook/cakto';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';
import { OrdersService } from '../../../src/services/orders.service';

function buildRequest(body: unknown, ip = '198.51.100.10'): Request {
  return new Request('http://localhost/api/webhook/cakto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  resetRateLimitStore();
  vi.stubEnv('CAKTO_WEBHOOK_SECRET', CAKTO_TEST_SECRET);
});

describe('POST /api/webhook/cakto', () => {
  describe('payload inválido', () => {
    it('retorna 400 quando body não contém estrutura mínima esperada', async () => {
      const res = await POST({
        request: buildRequest({ event: 'purchase_approved' }),
      } as never);
      expect(res.status).toBe(400);
    });

    it('retorna 429 após muitas tentativas do mesmo IP', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-order' }, error: null }),
          }),
        }),
      } as never);

      for (let attempt = 0; attempt < 30; attempt += 1) {
        const res = await POST({
          request: buildRequest(makeCaktoPayload(), '198.51.100.20'),
        } as never);
        expect(res.status).toBe(200);
      }

      const blockedResponse = await POST({
        request: buildRequest(makeCaktoPayload(), '198.51.100.20'),
      } as never);

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.headers.get('retry-after')).toBeTruthy();
    });
  });

  describe('validação de secret', () => {
    it('retorna 401 quando CAKTO_WEBHOOK_SECRET não está configurado', async () => {
      vi.stubEnv('CAKTO_WEBHOOK_SECRET', '');
      const res = await POST({ request: buildRequest(makeCaktoPayload()) } as never);
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando secret do payload é inválido', async () => {
      const res = await POST({
        request: buildRequest(makeCaktoPayload(CAKTO_TEST_SECRET, { secret: 'wrong-secret' })),
      } as never);
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando comprimentos diferem (bypass de timing-safe)', async () => {
      const res = await POST({
        request: buildRequest(makeCaktoPayload(CAKTO_TEST_SECRET, { secret: 'short' })),
      } as never);
      expect(res.status).toBe(401);
    });
  });

  describe('eventos ignorados', () => {
    it('retorna 200 sem ação para purchase_refused', async () => {
      const res = await POST({
        request: buildRequest(makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'purchase_refused' })),
      } as never);
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });

  describe('eventos de refund e chargeback', () => {
    it('retorna 200 e atualiza order para refunded no evento refund', async () => {
      const payload = makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'refund' });
      const res = await POST({ request: buildRequest(payload) } as never);
      expect(res.status).toBe(200);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
      expect(OrdersService.updateStatus).toHaveBeenCalledWith(payload.data.id, 'refunded');
    });

    it('retorna 200 e atualiza order para refunded no evento chargeback', async () => {
      const payload = makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'chargeback' });
      const res = await POST({ request: buildRequest(payload) } as never);
      expect(res.status).toBe(200);
      expect(OrdersService.updateStatus).toHaveBeenCalledWith(payload.data.id, 'refunded');
    });

    it('retorna 200 e atualiza order para refunded no evento purchase_refunded', async () => {
      const payload = makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'purchase_refunded' });
      const res = await POST({ request: buildRequest(payload) } as never);
      expect(res.status).toBe(200);
      expect(OrdersService.updateStatus).toHaveBeenCalledWith(payload.data.id, 'refunded');
    });

    it('retorna 500 quando updateStatus rejeita no refund', async () => {
      vi.mocked(OrdersService.updateStatus).mockRejectedValueOnce(new Error('DB error'));
      const payload = makeCaktoPayload(CAKTO_TEST_SECRET, { event: 'refund' });
      const res = await POST({ request: buildRequest(payload) } as never);
      expect(res.status).toBe(500);
    });
  });

  describe('allowlist do webhook', () => {
    it('retorna 403 quando product.id não está na allowlist configurada', async () => {
      vi.stubEnv('CAKTO_ALLOWED_PRODUCT_IDS', 'prod-allowed');
      const payload = makeCaktoPayload();
      payload.data.product.id = 'prod-blocked';

      const res = await POST({
        request: buildRequest(payload),
      } as never);

      expect(res.status).toBe(403);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('retorna 403 quando offer.id não está na allowlist configurada', async () => {
      vi.stubEnv('CAKTO_ALLOWED_OFFER_IDS', 'offer-allowed');
      const payload = makeCaktoPayload();
      payload.data.offer.id = 'offer-blocked';

      const res = await POST({
        request: buildRequest(payload),
      } as never);

      expect(res.status).toBe(403);
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('retorna 403 quando refId não está na allowlist configurada', async () => {
      vi.stubEnv('CAKTO_ALLOWED_REF_IDS', 'ref-allowed');
      const payload = makeCaktoPayload();
      payload.data.refId = 'ref-blocked';

      const res = await POST({
        request: buildRequest(payload),
      } as never);

      expect(res.status).toBe(403);
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

      const res = await POST({ request: buildRequest(makeCaktoPayload()) } as never);
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
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as never)
        .mockReturnValueOnce({
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'new-order-id' }], error: null }),
          }),
        } as never);

      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      vi.mocked(supabaseAdmin.auth.admin.generateLink).mockResolvedValueOnce({
        data: null,
        error: { message: 'link generation failed' },
      } as never);

      const res = await POST({ request: buildRequest(makeCaktoPayload()) } as never);
      expect(res.status).toBe(500);
    });
  });
});
