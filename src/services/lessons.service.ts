import { supabaseAdmin } from '../lib/supabase';
import type { Lesson } from '../types';

export class LessonsService {
  static async getAll(): Promise<Lesson[]> {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('is_published', true)
      .order('module_number')
      .order('order_number');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getAllAdmin(): Promise<Lesson[]> {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .order('module_number')
      .order('order_number');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getById(id: string): Promise<Lesson> {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getBySlug(slug: string): Promise<Lesson> {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(
    input: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Lesson> {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: Partial<Omit<Lesson, 'id' | 'created_at'>>): Promise<Lesson> {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async togglePublish(id: string, published: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('lessons')
      .update({ is_published: published, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
