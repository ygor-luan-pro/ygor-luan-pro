import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/progress.service', () => ({
  ProgressService: {
    markComplete: vi.fn(),
    updateWatchTime: vi.fn(),
  },
}));

vi.mock('../../../src/services/orders.service', () => ({
  OrdersService: {
    hasActiveAccess: vi.fn(),
  },
}));

import { POST as completePost } from '../../../src/pages/api/progress/complete';
import { POST as watchTimePost } from '../../../src/pages/api/progress/watch-time';
import { ProgressService } from '../../../src/services/progress.service';
import { OrdersService } from '../../../src/services/orders.service';

const mockUser = { id: 'user-1', email: 'user@example.com' };

function buildRequest(body: unknown): Request {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/progress/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 401 quando usuário não está autenticado', async () => {
    const req = buildRequest({ lessonId: 'lesson-1' });
    const res = await completePost({ request: req, locals: { user: null } } as never);

    expect(res.status).toBe(401);
    expect(ProgressService.markComplete).not.toHaveBeenCalled();
  });

  it('retorna 403 quando usuário não tem pedido aprovado', async () => {
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValueOnce(false);

    const req = buildRequest({ lessonId: 'lesson-1' });
    const res = await completePost({ request: req, locals: { user: mockUser } } as never);

    expect(res.status).toBe(403);
    expect(ProgressService.markComplete).not.toHaveBeenCalled();
  });

  it('chama markComplete quando usuário tem acesso', async () => {
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValueOnce(true);
    vi.mocked(ProgressService.markComplete).mockResolvedValueOnce(undefined);

    const req = buildRequest({ lessonId: 'lesson-1' });
    const res = await completePost({ request: req, locals: { user: mockUser } } as never);

    expect(res.status).toBe(200);
    expect(ProgressService.markComplete).toHaveBeenCalledWith('user-1', 'lesson-1');
  });
});

describe('POST /api/progress/watch-time', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 401 quando usuário não está autenticado', async () => {
    const req = buildRequest({ lessonId: 'lesson-1', watchTime: 30 });
    const res = await watchTimePost({ request: req, locals: { user: null } } as never);

    expect(res.status).toBe(401);
    expect(ProgressService.updateWatchTime).not.toHaveBeenCalled();
  });

  it('retorna 403 quando usuário não tem pedido aprovado', async () => {
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValueOnce(false);

    const req = buildRequest({ lessonId: 'lesson-1', watchTime: 30 });
    const res = await watchTimePost({ request: req, locals: { user: mockUser } } as never);

    expect(res.status).toBe(403);
    expect(ProgressService.updateWatchTime).not.toHaveBeenCalled();
  });

  it('chama updateWatchTime quando usuário tem acesso', async () => {
    vi.mocked(OrdersService.hasActiveAccess).mockResolvedValueOnce(true);
    vi.mocked(ProgressService.updateWatchTime).mockResolvedValueOnce(undefined);

    const req = buildRequest({ lessonId: 'lesson-1', watchTime: 120 });
    const res = await watchTimePost({ request: req, locals: { user: mockUser } } as never);

    expect(res.status).toBe(200);
    expect(ProgressService.updateWatchTime).toHaveBeenCalledWith('user-1', 'lesson-1', 120);
  });
});
