import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/mercadopago', () => ({
  preference: {
    create: vi.fn().mockResolvedValue({
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123',
      id: 'pref-123',
    }),
  },
  payment: { get: vi.fn() },
}));

import { POST } from '../../src/pages/api/checkout';
import { preference } from '../../src/lib/mercadopago';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:4321/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 quando e-mail não é fornecido', async () => {
    const response = await POST({ request: makeRequest({ productId: 'videoaulas' }) } as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/e-mail/i);
  });

  it('retorna 400 para productId inválido', async () => {
    const response = await POST({
      request: makeRequest({ email: 'test@test.com', productId: 'produto-invalido' }),
    } as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/produto/i);
  });

  it('cria preferência para produto videoaulas com preço R$ 297', async () => {
    vi.mocked(preference.create).mockResolvedValueOnce({
      init_point: 'https://mercadopago.com/checkout',
      id: 'pref-abc',
    } as never);

    const response = await POST({
      request: makeRequest({ email: 'test@test.com', productId: 'videoaulas' }),
    } as never);

    expect(response.status).toBe(200);
    expect(preference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ unit_price: 297 }),
          ]),
          payer: { email: 'test@test.com' },
        }),
      }),
    );
  });

  it('usa mentoria-completa como produto padrão quando productId não é fornecido', async () => {
    vi.mocked(preference.create).mockResolvedValueOnce({
      init_point: 'https://mercadopago.com/checkout',
      id: 'pref-default',
    } as never);

    await POST({ request: makeRequest({ email: 'test@test.com' }) } as never);

    expect(preference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ id: 'mentoria-completa' }),
          ]),
        }),
      }),
    );
  });

  it('retorna checkoutUrl e preferenceId quando sucesso', async () => {
    vi.mocked(preference.create).mockResolvedValueOnce({
      init_point: 'https://mercadopago.com/checkout/123',
      id: 'pref-xyz',
    } as never);

    const response = await POST({
      request: makeRequest({ email: 'test@test.com', productId: 'videoaulas' }),
    } as never);

    const body = await response.json();
    expect(body.checkoutUrl).toBe('https://mercadopago.com/checkout/123');
    expect(body.preferenceId).toBe('pref-xyz');
  });

  it('inclui notification_url e back_urls na preferência', async () => {
    vi.mocked(preference.create).mockResolvedValueOnce({
      init_point: 'https://mercadopago.com/checkout',
      id: 'pref-notif',
    } as never);

    await POST({
      request: makeRequest({ email: 'test@test.com', productId: 'videoaulas' }),
    } as never);

    expect(preference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          notification_url: expect.stringContaining('/api/webhook/pagamento'),
          back_urls: expect.objectContaining({
            success: expect.stringContaining('/obrigado'),
          }),
        }),
      }),
    );
  });
});
