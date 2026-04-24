type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  return headers.get('x-real-ip')?.trim() ?? 'unknown';
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
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, ttlSeconds, 'NX'],
      ]),
    });

    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);

    const results = await res.json() as [{ result: number }, { result: number }];
    const count = results[0]?.result ?? 1;

    return {
      allowed: count <= limit,
      retryAfterSeconds: ttlSeconds,
    };
  } catch (err) {
    console.warn('rate-limit: Upstash indisponível, usando fallback local', err);
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
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase()));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAccountLockout(email: string): Promise<RateLimitDecision> {
  const hash = await hashEmail(email);
  const key = `rl:acct:${hash}`;
  const redisUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const redisToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (res.ok) {
        const data = await res.json() as { result: string | null };
        const count = data.result ? parseInt(data.result, 10) : 0;
        return { allowed: count < ACCOUNT_LIMIT, retryAfterSeconds: Math.ceil(ACCOUNT_WINDOW_MS / 1000) };
      }
    } catch { /* fallback */ }
  }

  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (existing && now < existing.resetAt) {
    return {
      allowed: existing.count < ACCOUNT_LIMIT,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: Math.ceil(ACCOUNT_WINDOW_MS / 1000) };
}

export async function recordAccountFailure(email: string): Promise<void> {
  const hash = await hashEmail(email);
  const key = `rl:acct:${hash}`;
  const redisUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const redisToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    await consumeRateLimitRedis(key, ACCOUNT_LIMIT, ACCOUNT_WINDOW_MS, redisUrl, redisToken).catch(() => {});
    return;
  }

  consumeRateLimitLocal(key, ACCOUNT_LIMIT, ACCOUNT_WINDOW_MS, Date.now());
}
