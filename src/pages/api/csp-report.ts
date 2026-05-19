import type { APIRoute } from "astro";
import { logger } from "../../lib/logger";
import { consumeRateLimit, getClientIp } from "../../lib/rate-limit";

export const POST: APIRoute = async ({ request }) => {
  const rateLimit = await consumeRateLimit({
    bucket: "csp-report",
    identifier: getClientIp(request.headers),
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return new Response(null, { status: 429 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    logger.error("csp.violation", body);
  } catch {
    // malformed body — ignore
  }
  return new Response(null, { status: 204 });
};
