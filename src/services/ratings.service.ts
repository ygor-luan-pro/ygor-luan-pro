import { supabaseAdmin } from '../lib/supabase';
import type { LessonRating } from '../types';

type RatingWithJoins = LessonRating & {
  lessons: { title: string } | null;
  profiles: { full_name: string | null; email: string } | null;
};

export class RatingsService {
  static async getUserLessonRating(
    userId: string,
    lessonId: string
  ): Promise<LessonRating | null> {
    const { data, error } = await supabaseAdmin
      .from('lesson_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async upsertRating(
    userId: string,
    lessonId: string,
    rating: number,
    comment?: string
  ): Promise<LessonRating> {
    const { data, error } = await supabaseAdmin
      .from('lesson_ratings')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          rating,
          comment: comment ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getLessonStats(
    lessonId: string
  ): Promise<{ average: number; count: number }> {
    const { data, error } = await supabaseAdmin
      .from('lesson_ratings')
      .select('rating')
      .eq('lesson_id', lessonId);

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    if (rows.length === 0) return { average: 0, count: 0 };

    const sum = rows.reduce((acc, row) => acc + row.rating, 0);
    return { average: sum / rows.length, count: rows.length };
  }

  static async getAllRatings(): Promise<RatingWithJoins[]> {
    const { data, error } = await supabaseAdmin
      .from('lesson_ratings')
      .select('*, lessons(title), profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as RatingWithJoins[];
  }
}
