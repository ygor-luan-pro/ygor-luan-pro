import { supabaseAdmin } from '../lib/supabase-admin';
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
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle();

    return !!data;
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
