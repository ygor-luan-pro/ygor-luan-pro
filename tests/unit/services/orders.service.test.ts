import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersService } from '../../../src/services/orders.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';
import { logger } from '../../../src/lib/logger';
import type { Order } from '../../../src/types';

vi.mock('../../../src/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockOrder = {
  id: 'order-1',
  user_id: 'user-1',
  payment_id: 'pay-001',
  status: 'approved' as const,
  amount: 997,
  payment_method: 'credit_card',
  created_at: new Date().toISOString(),
  approved_at: new Date().toISOString(),
};

describe('OrdersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('retorna lista de pedidos do usuário', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockOrder], error: null }),
          }),
        }),
      } as never);

      const orders = await OrdersService.getByUserId('user-1');

      expect(orders).toHaveLength(1);
      expect(orders[0].payment_id).toBe('pay-001');
    });

    it('retorna array vazio quando usuário não tem pedidos', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);

      const orders = await OrdersService.getByUserId('user-sem-pedidos');
      expect(orders).toHaveLength(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as never);

      await expect(OrdersService.getByUserId('user-1')).rejects.toThrow('DB error');
    });
  });

  describe('hasActiveAccess', () => {
    it('retorna true quando usuário tem pedido aprovado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'order-1' }, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const hasAccess = await OrdersService.hasActiveAccess('user-1');
      expect(hasAccess).toBe(true);
    });

    it('retorna false quando usuário não tem pedido aprovado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const hasAccess = await OrdersService.hasActiveAccess('user-sem-acesso');
      expect(hasAccess).toBe(false);
    });

    it('retorna false e LOGA quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'XX000', message: 'connection lost' },
                }),
              }),
            }),
          }),
        }),
      } as never);

      expect(await OrdersService.hasActiveAccess('user-1')).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'orders.hasActiveAccess failed',
        expect.objectContaining({ userId: 'user-1', code: 'XX000' }),
      );
    });

    it('retorna false e LOGA quando query lança exceção', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementationOnce(() => {
        throw new Error('boom');
      });

      expect(await OrdersService.hasActiveAccess('user-1')).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'orders.hasActiveAccess threw',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  describe('getTotalRevenue', () => {
    it('retorna soma dos pedidos aprovados', async () => {
      const orders = [
        { ...mockOrder, amount: 997 },
        { ...mockOrder, id: 'order-2', amount: 297 },
      ];

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: orders, error: null }),
        }),
      } as never);

      const total = await OrdersService.getTotalRevenue();
      expect(total).toBe(1294);
    });

    it('retorna 0 quando não há pedidos aprovados', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const total = await OrdersService.getTotalRevenue();
      expect(total).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } }),
        }),
      } as never);

      await expect(OrdersService.getTotalRevenue()).rejects.toThrow('permission denied');
    });
  });

  describe('getAllAdmin', () => {
    it('retorna todos os pedidos', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockOrder], error: null }),
        }),
      } as never);

      const orders = await OrdersService.getAllAdmin();
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('approved');
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'forbidden' } }),
        }),
      } as never);

      await expect(OrdersService.getAllAdmin()).rejects.toThrow('forbidden');
    });
  });

  describe('updateStatus', () => {
    it('atualiza status do pedido por payment_id', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: mockUpdate,
      } as never);

      await OrdersService.updateStatus('pay-001', 'refunded');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('orders');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'refunded' });
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
        }),
      } as never);

      await expect(OrdersService.updateStatus('pay-001', 'refunded')).rejects.toThrow('update failed');
    });
  });

  describe('getLatestByUserId', () => {
    it('returns the most recent order for user', async () => {
      const mockOrderLatest: Order = {
        id: '1',
        user_id: 'user-1',
        payment_id: 'pay-1',
        status: 'pending',
        amount: 99700,
        payment_method: 'pix',
        created_at: '2026-01-01T00:00:00Z',
        approved_at: null,
      };
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockOrderLatest, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await OrdersService.getLatestByUserId('user-1');
      expect(result).toEqual(mockOrderLatest);
    });

    it('returns null when user has no orders', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await OrdersService.getLatestByUserId('user-2');
      expect(result).toBeNull();
    });

    it('returns null and logs when supabase returns error', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST301', message: 'DB error' } }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await OrdersService.getLatestByUserId('user-3');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('cria pedido via admin client e retorna o pedido criado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          }),
        }),
      } as never);

      const input = {
        user_id: 'user-1',
        payment_id: 'pay-001',
        status: 'approved' as const,
        amount: 997,
        payment_method: 'credit_card',
        approved_at: new Date().toISOString(),
      };

      const order = await OrdersService.create(input);
      expect(order.payment_id).toBe('pay-001');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });
});
