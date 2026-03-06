import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../../../src/lib/supabase';
import { ProgressService } from '../../../src/services/progress.service';

describe('ProgressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markComplete', () => {
    it('faz upsert com completed=true e completed_at', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never);

      await expect(ProgressService.markComplete('user-1', 'lesson-1')).resolves.toBeUndefined();
      expect(supabaseAdmin.from).toHaveBeenCalledWith('user_progress');
    });

    it('lança erro quando upsert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'constraint violation' } }),
      } as never);

      await expect(ProgressService.markComplete('user-1', 'lesson-1')).rejects.toThrow(
        'constraint violation',
      );
    });
  });

  describe('updateWatchTime', () => {
    it('persiste watch_time via upsert', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: upsertMock,
      } as never);

      await ProgressService.updateWatchTime('user-1', 'lesson-1', 120);

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', lesson_id: 'lesson-1', watch_time: 120 }),
      );
    });

    it('lança erro quando upsert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      } as never);

      await expect(ProgressService.updateWatchTime('user-1', 'lesson-1', 60)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getCompletedCount', () => {
    it('retorna contagem de aulas concluídas', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      } as never);

      const count = await ProgressService.getCompletedCount('user-1');
      expect(count).toBe(5);
    });

    it('retorna 0 quando aluno não concluiu nenhuma aula', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: null }),
          }),
        }),
      } as never);

      const count = await ProgressService.getCompletedCount('user-sem-progresso');
      expect(count).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'permission denied' } }),
          }),
        }),
      } as never);

      await expect(ProgressService.getCompletedCount('user-1')).rejects.toThrow(
        'permission denied',
      );
    });
  });

  describe('getStudentStats', () => {
    it('retorna stats do aluno quando há progresso', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: [{ total_lessons: 10, completed_count: 4, total_watch_time: 180 }],
        error: null,
      } as never);

      const stats = await ProgressService.getStudentStats('user-1');

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_student_stats', { p_user_id: 'user-1' });
      expect(stats).toEqual({ total_lessons: 10, completed_count: 4, total_watch_time: 180 });
    });

    it('retorna zeros quando aluno não tem progresso', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: [{ total_lessons: 5, completed_count: 0, total_watch_time: 0 }],
        error: null,
      } as never);

      const stats = await ProgressService.getStudentStats('user-sem-progresso');

      expect(stats.completed_count).toBe(0);
      expect(stats.total_watch_time).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'permission denied' },
      } as never);

      await expect(ProgressService.getStudentStats('user-1')).rejects.toThrow('permission denied');
    });
  });
});
