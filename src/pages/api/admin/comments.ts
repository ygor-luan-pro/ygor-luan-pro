import type { APIRoute } from "astro";
import { CommentsService } from "../../../services/comments.service";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!locals.isAdmin) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const comments = await CommentsService.getAllAdmin();
    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin comments GET:", err);
    return new Response(JSON.stringify({ error: "Erro ao buscar comentários" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
