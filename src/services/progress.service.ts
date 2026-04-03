import { supabaseAdmin } from '../lib/supabase-admin';
import type { StudentStats, UserProgress } from '../types';

export class ProgressService {
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<UserProgress | null> {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  static async markComplete(userId: string, lessonId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('user_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' },
    );

    if (error) throw new Error(error.message);
  }

  static async updateWatchTime(
    userId: string,
    lessonId: string,
    watchTime: number,
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('user_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        watch_time: watchTime,
      },
      { onConflict: 'user_id,lesson_id' },
    );

    if (error) throw new Error(error.message);
  }

  static async getCompletedCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async getStudentStats(userId: string): Promise<StudentStats> {
    const { data, error } = await supabaseAdmin.rpc('get_student_stats', { p_user_id: userId });

    if (error) throw new Error(error.message);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Dados inválidos de get_student_stats');
    }

    const [row] = data as StudentStats[];
    return row;
  }
}
