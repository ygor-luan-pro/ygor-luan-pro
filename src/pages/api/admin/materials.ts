import type { APIRoute } from "astro";
import { MaterialsService } from "../../../services/materials.service";

export const POST: APIRoute = async ({ locals, request }) => {
  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as {
    lesson_id?: string;
    title?: string;
    file_url?: string;
    file_type?: string;
  };

  if (!body.lesson_id || !body.title || !body.file_url) {
    return new Response(JSON.stringify({ error: "lesson_id, title e file_url são obrigatórios" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!/^[a-zA-Z0-9_\-/.]+$/.test(body.file_url) || body.file_url.includes("..")) {
    return new Response(
      JSON.stringify({
        error: "file_url deve ser um caminho relativo de storage (ex: uuid/arquivo.pdf)",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const material = await MaterialsService.create({
      lesson_id: body.lesson_id,
      title: body.title,
      file_url: body.file_url,
      file_type: body.file_type ?? null,
      file_size: null,
    });

    return new Response(JSON.stringify(material), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar material";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
