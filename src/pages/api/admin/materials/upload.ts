import type { APIRoute } from 'astro';
import { MaterialsService } from '../../../../services/materials.service';
import { UsersService } from '../../../../services/users.service';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  zip: 'application/zip',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }
  if (!(await UsersService.isAdmin(locals.user.id))) {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return new Response(JSON.stringify({ error: 'Arquivo excede o limite de 50 MB' }), { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const lessonId = formData.get('lessonId');
  const title = formData.get('title');

  if (!(file instanceof File) || typeof lessonId !== 'string' || typeof title !== 'string') {
    return new Response(JSON.stringify({ error: 'file, lessonId e title são obrigatórios' }), { status: 400 });
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(lessonId)) {
    return new Response(JSON.stringify({ error: 'lessonId inválido' }), { status: 400 });
  }

  const fileExt = (file.name.split('.').pop() ?? '').toLowerCase();
  const contentType = ALLOWED_EXTENSIONS[fileExt];
  if (!contentType) {
    return new Response(
      JSON.stringify({ error: `Tipo de arquivo não permitido. Permitidos: ${Object.keys(ALLOWED_EXTENSIONS).join(', ')}` }),
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return new Response(JSON.stringify({ error: 'Arquivo excede o limite de 50 MB' }), { status: 413 });
  }

  const storagePath = `${lessonId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('materials')
    .upload(storagePath, file, { contentType });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
  }

  const material = await MaterialsService.create({
    lesson_id: lessonId,
    title,
    file_url: storagePath,
    file_type: fileExt.toUpperCase(),
    file_size: file.size || null,
  });

  const acceptsJson = request.headers.get('Accept')?.includes('application/json');
  if (acceptsJson) {
    return new Response(JSON.stringify(material), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(null, { status: 302, headers: { Location: `/admin/aulas/${lessonId}/editar` } });
};
