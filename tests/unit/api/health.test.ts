import { describe, expect, it, vi } from "vitest";
import { GET } from "../../../src/pages/api/health";
import { supabaseAdmin } from "../../../src/lib/supabase-admin";

describe("GET /api/health", () => {
  it("retorna healthy quando o banco responde", async () => {
    vi.spyOn(supabaseAdmin, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as ReturnType<typeof supabaseAdmin.from>);

    const response = await GET({ request: new Request("http://localhost/api/health") } as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.database).toBe("ok");
  });

  it("retorna unhealthy quando o banco falha", async () => {
    vi.spyOn(supabaseAdmin, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: new Error("timeout") }),
      }),
    } as unknown as ReturnType<typeof supabaseAdmin.from>);

    const response = await GET({ request: new Request("http://localhost/api/health") } as Parameters<typeof GET>[0]);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database).toBe("fail");
  });

  it("retorna unhealthy quando o banco lança exceção", async () => {
    vi.spyOn(supabaseAdmin, "from").mockImplementation(() => {
      throw new Error("connection refused");
    });

    const response = await GET({ request: new Request("http://localhost/api/health") } as Parameters<typeof GET>[0]);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database).toBe("fail");
  });
});
