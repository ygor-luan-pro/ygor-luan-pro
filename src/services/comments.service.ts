import { supabaseAdmin } from '../lib/supabase-admin';
import type { LessonComment } from '../types';

type CommentWithProfile = LessonComment & {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type CommentWithAdminProfile = LessonComment & {
  profiles: { full_name: string | null; email: string } | null;
  lessons: { title: string } | null;
};

type CommentsError = {
  code?: string | null;
  message?: string | null;
};

export class CommentsUnavailableError extends Error {
  constructor() {
    super('Comentários indisponíveis no momento');
    this.name = 'CommentsUnavailableError';
  }
}

function isCommentsUnavailable(error: CommentsError | null | undefined): boolean {
  return error?.code === 'PGRST205' && error.message?.includes('lesson_comments') === true;
}

export class CommentsService {
  static async getByLesson(lessonId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('lesson_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('lesson_id', lessonId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (isCommentsUnavailable(error)) return [];
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CommentWithProfile[];
  }

  static async create(
    userId: string,
    lessonId: string,
    content: string
  ): Promise<LessonComment> {
    const { data, error } = await supabaseAdmin
      .from('lesson_comments')
      .insert({ user_id: userId, lesson_id: lessonId, content })
      .select()
      .single();

    if (isCommentsUnavailable(error)) throw new CommentsUnavailableError();
    if (error) throw new Error(error.message);
    return data;
  }

  static async getOwner(commentId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('lesson_comments')
      .select('user_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (isCommentsUnavailable(error)) throw new CommentsUnavailableError();
    if (error) throw new Error(error.message);
    return data?.user_id ?? null;
  }

  static async softDelete(commentId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('lesson_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .is('deleted_at', null);

    if (isCommentsUnavailable(error)) throw new CommentsUnavailableError();
    if (error) throw new Error(error.message);
  }

  static async getAllAdmin(): Promise<CommentWithAdminProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('lesson_comments')
      .select('*, profiles(full_name, email), lessons(title)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (isCommentsUnavailable(error)) return [];
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CommentWithAdminProfile[];
  }
}
