import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export class AuthService {
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  }

  static async updateProfile(
    userId: string,
    updates: Pick<Profile, 'full_name' | 'avatar_url'>,
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  }

  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/redefinir-senha`,
    });

    if (error) throw new Error(error.message);
  }
}
