import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { MaterialsService } from "../../../../services/materials.service";
import { UsersService } from "../../../../services/users.service";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  zip: "application/zip",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
];

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

async function hasValidFileSignature(file: File, extension: string): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (extension === "pdf") {
    return startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46]);
  }

  if (extension === "png") {
    return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (extension === "jpg" || extension === "jpeg") {
    return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  }

  if (extension === "zip" || extension === "xlsx") {
    return ZIP_SIGNATURES.some((signature) => startsWithBytes(bytes, signature));
  }

  return false;
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });
  }
  if (!(await UsersService.isAdmin(locals.user.id))) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return new Response(JSON.stringify({ error: "Arquivo excede o limite de 50 MB" }), {
      status: 413,
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const lessonId = formData.get("lessonId");
  const title = formData.get("title");

  if (!(file instanceof File) || typeof lessonId !== "string" || typeof title !== "string") {
    return new Response(JSON.stringify({ error: "file, lessonId e title são obrigatórios" }), {
      status: 400,
    });
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(lessonId)) {
    return new Response(JSON.stringify({ error: "lessonId inválido" }), { status: 400 });
  }

  const fileExt = (file.name.split(".").pop() ?? "").toLowerCase();
  const contentType = ALLOWED_EXTENSIONS[fileExt];
  if (!contentType) {
    return new Response(
      JSON.stringify({
        error: `Tipo de arquivo não permitido. Permitidos: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}`,
      }),
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return new Response(JSON.stringify({ error: "Arquivo excede o limite de 50 MB" }), {
      status: 413,
    });
  }

  if (!(await hasValidFileSignature(file, fileExt))) {
    return new Response(JSON.stringify({ error: "Assinatura do arquivo inválida" }), {
      status: 400,
    });
  }

  const storagePath = `${lessonId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("materials")
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

  const acceptsJson = request.headers.get("Accept")?.includes("application/json");
  if (acceptsJson) {
    return new Response(JSON.stringify(material), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, {
    status: 302,
    headers: { Location: `/admin/aulas/${lessonId}/editar` },
  });
};
