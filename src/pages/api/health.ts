import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async () => {
  const checks: Record<string, "ok" | "fail"> = {
    database: "ok",
  };

  try {
    const { error } = await supabaseAdmin.from("profiles").select("id", { head: true }).limit(1);
    if (error) {
      checks.database = "fail";
    }
  } catch {
    checks.database = "fail";
  }

  const allOk = Object.values(checks).every((s) => s === "ok");
  const status = allOk ? 200 : 503;

  return new Response(
    JSON.stringify({ status: allOk ? "healthy" : "unhealthy", checks }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
};
