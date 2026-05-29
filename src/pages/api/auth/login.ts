import { createServerClient } from "@supabase/ssr";
import type { APIRoute } from "astro";
import {
  checkAccountLockout,
  consumeRateLimit,
  getClientIp,
  recordAccountFailure,
} from "../../../lib/rate-limit";
import { getSupabaseCookies, setSupabaseCookies } from "../../../lib/supabase-cookie-bridge";
import type { Database } from "../../../types/database.types";

export const POST: APIRoute = async ({ request, cookies }) => {
  const rateLimit = await consumeRateLimit({
    bucket: "auth-login",
    identifier: getClientIp(request.headers),
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Muitas tentativas. Tente novamente em instantes." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "E-mail e senha obrigatórios" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accountLockout = await checkAccountLockout(email);
  if (!accountLockout.allowed) {
    return new Response(
      JSON.stringify({ error: "Muitas tentativas. Tente novamente em instantes." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(accountLockout.retryAfterSeconds),
        },
      },
    );
  }

  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => getSupabaseCookies(request.headers.get("Cookie")),
        setAll: (cookiesToSet) => setSupabaseCookies(cookies, cookiesToSet),
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    void recordAccountFailure(email).catch(() => {});
    return new Response(JSON.stringify({ error: "E-mail ou senha inválidos" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
