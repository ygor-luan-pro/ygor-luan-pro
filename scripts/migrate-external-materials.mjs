import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  getAllowedMimeType,
  getFilenameFromContentDisposition,
  inferExtension,
  isExternalUrl,
  sanitizeFilename,
  toDownloadableMaterialUrl,
} from './materials-migration-lib.mjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios');
}

const dryRun = process.argv.includes('--dry-run');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: materials, error: materialsError } = await supabaseAdmin
  .from('materials')
  .select('id, lesson_id, title, file_url, file_type, file_size, created_at');

if (materialsError) {
  throw new Error(`Falha ao carregar materiais: ${materialsError.message}`);
}

const externalMaterials = (materials ?? []).filter((material) => isExternalUrl(material.file_url));

if (externalMaterials.length === 0) {
  console.log('Nenhum material externo encontrado.');
  process.exit(0);
}

for (const material of externalMaterials) {
  const downloadUrl = toDownloadableMaterialUrl(material.file_url);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${material.id}: ${response.status} ${response.statusText}`);
  }

  const contentDisposition = response.headers.get('content-disposition');
  const originalFileName = getFilenameFromContentDisposition(contentDisposition)
    ?? `${material.title || 'material'}.${material.file_type?.toLowerCase() || 'bin'}`;
  const fileName = sanitizeFilename(originalFileName);
  const contentType = response.headers.get('content-type');
  const extension = inferExtension({ fileName, contentType });
  const allowedMimeType = getAllowedMimeType(extension);

  if (!allowedMimeType) {
    throw new Error(`Tipo nao suportado para ${material.id}: ${extension}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const storagePath = `${material.lesson_id}/${crypto.randomUUID()}.${extension}`;

  console.log(`${dryRun ? '[dry-run] ' : ''}migrando ${material.id} -> ${storagePath}`);

  if (dryRun) {
    continue;
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from('materials')
    .upload(storagePath, bytes, {
      contentType: allowedMimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha no upload de ${material.id}: ${uploadError.message}`);
  }

  const { error: updateError } = await supabaseAdmin
    .from('materials')
    .update({
      file_url: storagePath,
      file_type: extension.toUpperCase(),
      file_size: bytes.byteLength,
    })
    .eq('id', material.id);

  if (updateError) {
    await supabaseAdmin.storage.from('materials').remove([storagePath]);
    throw new Error(`Falha ao atualizar ${material.id}: ${updateError.message}`);
  }

  console.log(`migrado ${material.id}: ${material.file_url} -> ${storagePath}`);
}

console.log(`Migracao concluida. Materiais processados: ${externalMaterials.length}`);
