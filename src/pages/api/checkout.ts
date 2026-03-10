import type { APIRoute } from 'astro';
import { preference } from '../../lib/mercadopago';
import type { ProductId } from '../../types';

const isLaunchMode = import.meta.env.PUBLIC_IS_LAUNCH_MODE === 'true';

const PRODUCT_CATALOG: Record<ProductId, { title: string; description: string; price: number }> = {
  'videoaulas': {
    title: 'Videoaulas – Ygor Luan Pro',
    description: 'Acesso completo às videoaulas',
    price: 297,
  },
  'mentoria-completa': {
    title: 'Mentoria Completa – Ygor Luan Pro',
    description: 'Videoaulas + 4 sessões de mentoria 1:1',
    price: isLaunchMode ? 997 : 1497,
  },
};

export const POST: APIRoute = async ({ request }) => {
  const { email, productId } = await request.json() as { email?: string; productId?: ProductId };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'E-mail inválido ou obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resolvedProductId: ProductId = productId ?? 'mentoria-completa';

  if (!(resolvedProductId in PRODUCT_CATALOG)) {
    return new Response(JSON.stringify({ error: 'Produto inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const product = PRODUCT_CATALOG[resolvedProductId];
  const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
  const isMock = (import.meta.env.MERCADOPAGO_ACCESS_TOKEN ?? '').startsWith('APP_USR_xxx');

  if (isMock) {
    return new Response(
      JSON.stringify({ checkoutUrl: `${siteUrl}/obrigado?mock=true`, preferenceId: 'mock' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const response = await preference.create({
    body: {
      items: [
        {
          id: resolvedProductId,
          title: product.title,
          description: product.description,
          quantity: 1,
          unit_price: product.price,
          currency_id: 'BRL',
        },
      ],
      payer: { email },
      back_urls: {
        success: `${siteUrl}/obrigado`,
        failure: `${siteUrl}/?checkout=failed`,
        pending: `${siteUrl}/obrigado?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhook/pagamento`,
      metadata: { buyer_email: email, product_id: resolvedProductId },
    },
  });

  return new Response(
    JSON.stringify({ checkoutUrl: response.init_point, preferenceId: response.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
