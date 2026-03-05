import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';
import { ProgressService } from '../../../src/services/progress.service';

describe('ProgressService.getStudentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna stats do aluno quando há progresso', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [{ total_lessons: 10, completed_count: 4, total_watch_time: 180 }],
      error: null,
    } as never);

    const stats = await ProgressService.getStudentStats('user-1');

    expect(supabase.rpc).toHaveBeenCalledWith('get_student_stats', { p_user_id: 'user-1' });
    expect(stats).toEqual({ total_lessons: 10, completed_count: 4, total_watch_time: 180 });
  });

  it('retorna zeros quando aluno não tem progresso', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [{ total_lessons: 5, completed_count: 0, total_watch_time: 0 }],
      error: null,
    } as never);

    const stats = await ProgressService.getStudentStats('user-sem-progresso');

    expect(stats.completed_count).toBe(0);
    expect(stats.total_watch_time).toBe(0);
  });

  it('lança erro quando Supabase retorna erro', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied' },
    } as never);

    await expect(ProgressService.getStudentStats('user-1')).rejects.toThrow('permission denied');
  });
});
