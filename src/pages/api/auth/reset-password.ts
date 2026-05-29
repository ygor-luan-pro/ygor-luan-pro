import type { APIRoute } from "astro";
import { consumeRateLimit, getClientIp } from "../../../lib/rate-limit";
import { AuthService } from "../../../services/auth.service";

export const POST: APIRoute = async ({ request }) => {
  const rateLimit = await consumeRateLimit({
    bucket: "auth-reset-password",
    identifier: getClientIp(request.headers),
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Muitas tentativas. Tente novamente mais tarde." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return new Response(JSON.stringify({ error: "E-mail obrigatório" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await AuthService.resetPassword(email);
  } catch (err) {
    console.error("reset-password: erro interno", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
