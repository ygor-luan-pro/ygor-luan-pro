import { supabaseAdmin } from '../lib/supabase-admin';
import type { Material } from '../types';

export class MaterialsService {
  static async getByLessonId(lessonId: string): Promise<Material[]> {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async create(input: Omit<Material, 'id' | 'created_at'>): Promise<Material> {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getById(id: string): Promise<Material> {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  static async getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from('materials')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) throw new Error(error.message);
    return data.signedUrl;
  }
}
