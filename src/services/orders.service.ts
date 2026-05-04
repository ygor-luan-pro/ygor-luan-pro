import { supabaseAdmin } from '../lib/supabase-admin';
import { logger } from '../lib/logger';
import type { Order } from '../types';

export class OrdersService {
  static async getByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async hasActiveAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('orders.hasActiveAccess failed', { userId, code: error.code, message: error.message });
        return false;
      }
      return !!data;
    } catch (err) {
      logger.error('orders.hasActiveAccess threw', { userId, err: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }

  static async getLatestByUserId(userId: string): Promise<Order | null> {
    if (!userId) throw new Error('getLatestByUserId: userId required');
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('orders.getLatestByUserId failed', { userId, code: error.code, message: error.message });
        return null;
      }
      return data;
    } catch (err) {
      logger.error('orders.getLatestByUserId threw', { userId, err: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }

  static async getByPaymentId(paymentId: string): Promise<Order | null> {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    return data;
  }

  static async getAllAdmin(): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getTotalRevenue(): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('amount')
      .eq('status', 'approved');

    if (error) throw new Error(error.message);
    return (data ?? []).reduce((sum, o) => sum + o.amount, 0);
  }

  static async updateStatus(
    paymentId: string,
    status: Order['status'],
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('payment_id', paymentId);

    if (error) throw new Error(error.message);
  }

  static async create(
    input: Omit<Order, 'id' | 'created_at'>,
  ): Promise<Order> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
