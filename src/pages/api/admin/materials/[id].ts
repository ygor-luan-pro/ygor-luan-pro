import type { APIRoute } from 'astro';
import { MaterialsService } from '../../../../services/materials.service';

export const DELETE: APIRoute = async ({ locals, params }) => {
  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (!params.id) {
    return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const material = await MaterialsService.getById(params.id);
    await MaterialsService.delete(params.id);
    if (!/^https?:\/\//i.test(material.file_url)) {
      try {
        await MaterialsService.removeFile(material.file_url);
      } catch (err) {
        console.error('materials DELETE storage cleanup:', err);
      }
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao remover material';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
