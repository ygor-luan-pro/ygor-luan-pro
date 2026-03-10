import { supabaseAdmin } from '../lib/supabase';
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
}
