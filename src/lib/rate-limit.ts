import { logger } from "./logger";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type UpstashPipelineEntry = { result?: unknown };
type UpstashPipelineResult = UpstashPipelineEntry[];

const UPSTASH_PIPELINE_EXPECTED_LENGTH = 2;

function isUpstashPipelineResult(value: unknown): value is UpstashPipelineResult {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "object" && entry !== null)
  );
}

function isUpstashGetResult(value: unknown): value is { result: string | null } {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { result?: unknown };
  return candidate.result === null || typeof candidate.result === "string";
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function isProd(): boolean {
  return import.meta.env.PROD === true;
}

export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return headers.get("x-real-ip")?.trim() ?? "unknown";
}

function consumeRateLimitLocal(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): RateLimitDecision {
  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: existing.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

async function consumeRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number,
  url: string,
  token: string,
): Promise<RateLimitDecision> {
  const ttlSeconds = Math.ceil(windowMs / 1000);

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, ttlSeconds, "NX"],
      ]),
    });

    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);

    const payload: unknown = await res.json();
    if (!isUpstashPipelineResult(payload) || payload.length < UPSTASH_PIPELINE_EXPECTED_LENGTH) {
      throw new Error("Upstash unexpected response shape");
    }
    const firstResult = payload[0]?.result;
    if (typeof firstResult !== "number") {
      throw new Error("Upstash INCR result not numeric");
    }

    return {
      allowed: firstResult <= limit,
      retryAfterSeconds: ttlSeconds,
    };
  } catch (err) {
    logger.warn("rate-limit.upstash.fallback", {
      err: err instanceof Error ? err.message : String(err),
    });
    if (isProd()) {
      return { allowed: false, retryAfterSeconds: ttlSeconds };
    }
    return consumeRateLimitLocal(key, limit, windowMs, Date.now());
  }
}

export async function consumeRateLimit({
  bucket,
  identifier,
  limit,
  windowMs,
  now = Date.now(),
}: {
  bucket: string;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: number;
}): Promise<RateLimitDecision> {
  const key = `rl:${bucket}:${identifier}`;
  const redisUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const redisToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    return consumeRateLimitRedis(key, limit, windowMs, redisUrl, redisToken);
  }

  return consumeRateLimitLocal(key, limit, windowMs, now);
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

const ACCOUNT_LIMIT = 10;
const ACCOUNT_WINDOW_MS = 60 * 60 * 1000;

async function hashEmail(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const pepper = import.meta.env.RATE_LIMIT_PEPPER;

  if (pepper) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(pepper),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, data);
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function checkAccountLockout(email: string): Promise<RateLimitDecision> {
  const hash = await hashEmail(email);
  const key = `rl:acct:${hash}`;
  const ttlSeconds = Math.ceil(ACCOUNT_WINDOW_MS / 1000);
  const redisUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const redisToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);

      const payload: unknown = await res.json();
      if (!isUpstashGetResult(payload)) {
        throw new Error("Upstash GET unexpected response shape");
      }
      const count = payload.result ? Number.parseInt(payload.result, 10) : 0;
      return {
        allowed: count < ACCOUNT_LIMIT,
        retryAfterSeconds: ttlSeconds,
      };
    } catch (err) {
      logger.warn("rate-limit.account-lockout.upstash-fallback", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (existing && now < existing.resetAt) {
    return {
      allowed: existing.count < ACCOUNT_LIMIT,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: ttlSeconds };
}

export async function recordAccountFailure(email: string): Promise<void> {
  const hash = await hashEmail(email);
  const key = `rl:acct:${hash}`;
  const redisUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const redisToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    await consumeRateLimitRedis(key, ACCOUNT_LIMIT, ACCOUNT_WINDOW_MS, redisUrl, redisToken).catch(
      () => {
        /* recorded best-effort */
      },
    );
    return;
  }

  consumeRateLimitLocal(key, ACCOUNT_LIMIT, ACCOUNT_WINDOW_MS, Date.now());
}
