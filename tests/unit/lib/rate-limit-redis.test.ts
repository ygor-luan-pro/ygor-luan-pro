import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");

const { loggerMock } = vi.hoisted(() => ({
  loggerMock: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../../../src/lib/logger", () => ({ logger: loggerMock }));

import {
  checkAccountLockout,
  consumeRateLimit,
  recordAccountFailure,
  resetRateLimitStore,
} from "../../../src/lib/rate-limit";

const originalFetch = globalThis.fetch;

function mockFetch(impl: typeof fetch): void {
  globalThis.fetch = impl as typeof fetch;
}

describe("rate-limit Upstash path", () => {
  beforeEach(() => {
    resetRateLimitStore();
    loggerMock.warn.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("consumeRateLimit via Upstash pipeline", () => {
    it("returns allowed when INCR count <= limit", async () => {
      mockFetch(
        async () => new Response(JSON.stringify([{ result: 3 }, { result: 1 }]), { status: 200 }),
      );

      const decision = await consumeRateLimit({
        bucket: "login",
        identifier: "1.2.3.4",
        limit: 5,
        windowMs: 60_000,
      });

      expect(decision.allowed).toBe(true);
    });

    it("returns blocked when INCR count exceeds limit", async () => {
      mockFetch(
        async () => new Response(JSON.stringify([{ result: 11 }, { result: 0 }]), { status: 200 }),
      );

      const decision = await consumeRateLimit({
        bucket: "login",
        identifier: "1.2.3.4",
        limit: 10,
        windowMs: 60_000,
      });

      expect(decision.allowed).toBe(false);
    });

    it("falls back to local on HTTP error and logs warning (non-prod)", async () => {
      mockFetch(async () => new Response("", { status: 500 }));

      const decision = await consumeRateLimit({
        bucket: "login",
        identifier: "5.6.7.8",
        limit: 5,
        windowMs: 60_000,
      });

      expect(decision.allowed).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        "rate-limit.upstash.fallback",
        expect.objectContaining({ err: expect.stringContaining("Upstash HTTP 500") }),
      );
    });

    it("falls back to local on malformed pipeline response (length < 2)", async () => {
      mockFetch(async () => new Response(JSON.stringify([{ result: 1 }]), { status: 200 }));

      const decision = await consumeRateLimit({
        bucket: "login",
        identifier: "9.9.9.9",
        limit: 5,
        windowMs: 60_000,
      });

      expect(decision.allowed).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        "rate-limit.upstash.fallback",
        expect.objectContaining({ err: expect.stringContaining("unexpected response shape") }),
      );
    });

    it("falls back when INCR result is not numeric", async () => {
      mockFetch(
        async () =>
          new Response(JSON.stringify([{ result: "oops" }, { result: 1 }]), { status: 200 }),
      );

      await consumeRateLimit({
        bucket: "login",
        identifier: "10.10.10.10",
        limit: 5,
        windowMs: 60_000,
      });

      expect(loggerMock.warn).toHaveBeenCalledWith(
        "rate-limit.upstash.fallback",
        expect.objectContaining({ err: expect.stringContaining("INCR result not numeric") }),
      );
    });

    it("falls back to local when fetch throws (network error)", async () => {
      mockFetch(async () => {
        throw new Error("ECONNREFUSED");
      });

      const decision = await consumeRateLimit({
        bucket: "login",
        identifier: "11.11.11.11",
        limit: 5,
        windowMs: 60_000,
      });

      expect(decision.allowed).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        "rate-limit.upstash.fallback",
        expect.objectContaining({ err: "ECONNREFUSED" }),
      );
    });
  });

  describe("checkAccountLockout via Upstash GET", () => {
    it("allows when stored count below limit", async () => {
      mockFetch(async () => new Response(JSON.stringify({ result: "3" }), { status: 200 }));

      const decision = await checkAccountLockout("user@test.com");
      expect(decision.allowed).toBe(true);
    });

    it("blocks when stored count at limit", async () => {
      mockFetch(async () => new Response(JSON.stringify({ result: "10" }), { status: 200 }));

      const decision = await checkAccountLockout("user@test.com");
      expect(decision.allowed).toBe(false);
    });

    it("allows when result is null (no failures stored)", async () => {
      mockFetch(async () => new Response(JSON.stringify({ result: null }), { status: 200 }));

      const decision = await checkAccountLockout("fresh@test.com");
      expect(decision.allowed).toBe(true);
    });

    it("falls back to local store on malformed response", async () => {
      mockFetch(async () => new Response(JSON.stringify({ result: 42 }), { status: 200 }));

      const decision = await checkAccountLockout("user@test.com");
      expect(decision.allowed).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        "rate-limit.account-lockout.upstash-fallback",
        expect.objectContaining({ err: expect.stringContaining("unexpected response shape") }),
      );
    });

    it("falls back to local store on HTTP error", async () => {
      mockFetch(async () => new Response("", { status: 503 }));

      const decision = await checkAccountLockout("user@test.com");
      expect(decision.allowed).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe("recordAccountFailure via Upstash pipeline", () => {
    it("does not throw when Upstash returns OK", async () => {
      mockFetch(
        async () => new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 }),
      );

      await expect(recordAccountFailure("user@test.com")).resolves.toBeUndefined();
    });

    it("swallows errors when Upstash fails", async () => {
      mockFetch(async () => {
        throw new Error("boom");
      });

      await expect(recordAccountFailure("user@test.com")).resolves.toBeUndefined();
    });
  });
});
