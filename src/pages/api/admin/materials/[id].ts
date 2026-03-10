import type { APIRoute } from 'astro';
import { MaterialsService } from '../../../../services/materials.service';
import { UsersService } from '../../../../services/users.service';
import { supabaseAdmin } from '../../../../lib/supabase';

const handleDelete: APIRoute = async ({ params, locals, request }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }
  if (!(await UsersService.isAdmin(locals.user.id))) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  const material = await MaterialsService.getById(id).catch(() => null);

  if (material?.file_url) {
    await supabaseAdmin.storage.from('materials').remove([material.file_url]);
  }

  await MaterialsService.delete(id);

  const acceptsJson = request.headers.get('Accept')?.includes('application/json');
  if (acceptsJson) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
  const referer = request.headers.get('Referer') ?? '/admin/aulas';
  return new Response(null, { status: 302, headers: { Location: referer } });
};

export const DELETE: APIRoute = handleDelete;

export const POST: APIRoute = async (context) => {
  const formData = await context.request.formData();
  if (formData.get('_method') === 'DELETE') return handleDelete(context);
  return new Response(JSON.stringify({ error: 'Method not supported' }), { status: 405 });
};
