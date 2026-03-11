import type { APIRoute } from 'astro';
import { MaterialsService } from '../../../../services/materials.service';

export const DELETE: APIRoute = async ({ locals, params }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }
  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  if (!params.id) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
  }

  try {
    await MaterialsService.delete(params.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao remover material';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
