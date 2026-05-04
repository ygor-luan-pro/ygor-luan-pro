import type { APIRoute } from 'astro';
import { OrdersService } from '../../../services/orders.service';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [hasAccess, lastOrder] = await Promise.all([
    OrdersService.hasActiveAccess(locals.user.id),
    OrdersService.getLatestByUserId(locals.user.id),
  ]);

  return new Response(
    JSON.stringify({
      hasAccess,
      lastOrder: lastOrder
        ? { status: lastOrder.status, created_at: lastOrder.created_at }
        : null,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
      },
    },
  );
};
