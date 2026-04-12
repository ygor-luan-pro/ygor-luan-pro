import { createHmac } from 'crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../../src/lib/supabase-admin';
import { POST } from '../../src/pages/api/webhook/cal-booking';

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/webhook/cal-booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function makeCtx(body: unknown, headers: Record<string, string> = {}) {
  return { request: makeRequest(body, headers) } as Parameters<typeof POST>[0];
}

const BOOKING_CREATED_PAYLOAD = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    startTime: '2026-04-01T10:00:00Z',
    attendees: [{ email: 'aluno@email.com', name: 'Aluno Teste' }],
    videoCallData: { url: 'https://meet.example.com/abc' },
  },
};

const TEST_SECRET = 'test-secret';

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('POST /api/webhook/cal-booking', () => {
  describe('JSON inválido', () => {
    it('retorna 400 quando body não é JSON válido', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const rawBody = 'not-valid-json{{{';
      const signature = signBody(rawBody, TEST_SECRET);

      const res = await POST({
        request: new Request('http://localhost/api/webhook/cal-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Cal-Signature-256': signature },
          body: rawBody,
        }),
      } as Parameters<typeof POST>[0]);

      expect(res.status).toBe(400);
    });
  });

  describe('autenticação', () => {
    it('retorna 401 quando CAL_WEBHOOK_SECRET não está configurado', async () => {
      const body = JSON.stringify(BOOKING_CREATED_PAYLOAD);
      const signature = signBody(body, TEST_SECRET);
      const res = await POST(
        makeCtx(BOOKING_CREATED_PAYLOAD, { 'X-Cal-Signature-256': signature }),
      );
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando assinatura é inválida', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const res = await POST(
        makeCtx(BOOKING_CREATED_PAYLOAD, { 'X-Cal-Signature-256': 'invalidsignature' }),
      );
      expect(res.status).toBe(401);
    });

    it('retorna 401 quando assinatura está ausente', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const res = await POST(makeCtx(BOOKING_CREATED_PAYLOAD));
      expect(res.status).toBe(401);
    });

    it('retorna 401 com assinatura de comprimento correto mas conteúdo incorreto', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const payload = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: {} });
      const wrongSignature = 'a'.repeat(64);

      const response = await POST({
        request: new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Cal-Signature-256': wrongSignature },
          body: payload,
        }),
      } as Parameters<typeof POST>[0]);

      expect(response.status).toBe(401);
    });
  });

  describe('eventos ignorados', () => {
    it('retorna 200 quando triggerEvent não é BOOKING_CREATED', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const payload = { triggerEvent: 'BOOKING_CANCELLED', payload: {} };
      const body = JSON.stringify(payload);
      const signature = signBody(body, TEST_SECRET);

      const res = await POST(makeCtx(payload, { 'X-Cal-Signature-256': signature }));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).not.toHaveBeenCalled();
    });
  });

  describe('BOOKING_CREATED com payload válido', () => {
    it('retorna 200 e chama upsert em mentorship_sessions', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'user-uuid' }, error: null }),
          }),
        }),
      } as never);

      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: insertMock,
      } as never);

      const body = JSON.stringify(BOOKING_CREATED_PAYLOAD);
      const signature = signBody(body, TEST_SECRET);

      const res = await POST(makeCtx(BOOKING_CREATED_PAYLOAD, { 'X-Cal-Signature-256': signature }));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('mentorship_sessions');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid',
          scheduled_at: '2026-04-01T10:00:00Z',
          status: 'scheduled',
        }),
      );
    });
  });

  describe('email do attendee ausente', () => {
    it('retorna 400 quando attendees está vazio', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const payload = {
        triggerEvent: 'BOOKING_CREATED',
        payload: { startTime: '2026-04-01T10:00:00Z', attendees: [] },
      };
      const body = JSON.stringify(payload);
      const signature = signBody(body, TEST_SECRET);

      const res = await POST(makeCtx(payload, { 'X-Cal-Signature-256': signature }));
      expect(res.status).toBe(400);
    });

    it('retorna 400 quando attendees está ausente', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);
      const payload = {
        triggerEvent: 'BOOKING_CREATED',
        payload: { startTime: '2026-04-01T10:00:00Z' },
      };
      const body = JSON.stringify(payload);
      const signature = signBody(body, TEST_SECRET);

      const res = await POST(makeCtx(payload, { 'X-Cal-Signature-256': signature }));
      expect(res.status).toBe(400);
    });
  });

  describe('usuário desconhecido', () => {
    it('retorna 200 sem chamar upsert quando profile não é encontrado', async () => {
      vi.stubEnv('CAL_WEBHOOK_SECRET', TEST_SECRET);

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      } as never);

      const body = JSON.stringify(BOOKING_CREATED_PAYLOAD);
      const signature = signBody(body, TEST_SECRET);

      const res = await POST(makeCtx(BOOKING_CREATED_PAYLOAD, { 'X-Cal-Signature-256': signature }));
      expect(res.status).toBe(200);
      expect(supabaseAdmin.from).not.toHaveBeenCalledWith('mentorship_sessions');
    });
  });
});
