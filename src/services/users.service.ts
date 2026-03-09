import { supabaseAdmin } from '../lib/supabase';
import type { Profile } from '../types';

export class UsersService {
  static async getAllAdmin(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async countStudents(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async isAdmin(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role === 'admin';
  }
}
