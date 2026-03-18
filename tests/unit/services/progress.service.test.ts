import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressService } from '../../../src/services/progress.service';
import { supabaseAdmin } from '../../../src/lib/supabase';

vi.mock('../../../src/lib/supabase', () => ({
  supabaseAdmin: { from: vi.fn(), rpc: vi.fn() },
}));

const mockProgress = {
  id: 'progress-1',
  user_id: 'user-1',
  lesson_id: 'lesson-1',
  completed: true,
  watch_time: 120,
  completed_at: new Date().toISOString(),
};

const mockStats = {
  total_lessons: 10,
  completed_count: 3,
  total_watch_time: 360,
};

describe('ProgressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProgress', () => {
    it('retorna lista de progresso do usuário', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [mockProgress], error: null }),
        }),
      } as never);

      const result = await ProgressService.getUserProgress('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].lesson_id).toBe('lesson-1');
    });

    it('retorna array vazio quando não há progresso', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const result = await ProgressService.getUserProgress('user-1');
      expect(result).toEqual([]);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      } as never);

      await expect(ProgressService.getUserProgress('user-1')).rejects.toThrow('DB error');
    });
  });

  describe('getLessonProgress', () => {
    it('retorna null quando progresso não encontrado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await ProgressService.getLessonProgress('user-1', 'lesson-x');
      expect(result).toBeNull();
    });

    it('retorna dados de progresso quando encontrado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await ProgressService.getLessonProgress('user-1', 'lesson-1');
      expect(result?.completed).toBe(true);
      expect(result?.lesson_id).toBe('lesson-1');
    });

    it('lança erro quando Supabase retorna erro real (não PGRST116)', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: '42P01', message: 'relation error' } }),
            }),
          }),
        }),
      } as never);

      await expect(ProgressService.getLessonProgress('user-1', 'lesson-1')).rejects.toThrow('relation error');
    });

    it('retorna null para erro PGRST116 (not found)', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } }),
            }),
          }),
        }),
      } as never);

      const result = await ProgressService.getLessonProgress('user-1', 'lesson-x');
      expect(result).toBeNull();
    });
  });

  describe('markComplete', () => {
    it('chama upsert com onConflict correto e resolve sem erro', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: upsertMock,
      } as never);

      await expect(ProgressService.markComplete('user-1', 'lesson-1')).resolves.toBeUndefined();
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', lesson_id: 'lesson-1', completed: true }),
        { onConflict: 'user_id,lesson_id' },
      );
    });

    it('lança erro quando upsert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'upsert error' } }),
      } as never);

      await expect(ProgressService.markComplete('user-1', 'lesson-1')).rejects.toThrow('upsert error');
    });
  });

  describe('updateWatchTime', () => {
    it('chama upsert com watchTime correto', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: upsertMock,
      } as never);

      await expect(ProgressService.updateWatchTime('user-1', 'lesson-1', 180)).resolves.toBeUndefined();
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ watch_time: 180, user_id: 'user-1', lesson_id: 'lesson-1' }),
        { onConflict: 'user_id,lesson_id' },
      );
    });

    it('lança erro quando upsert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'watch error' } }),
      } as never);

      await expect(ProgressService.updateWatchTime('user-1', 'lesson-1', 60)).rejects.toThrow('watch error');
    });
  });

  describe('getCompletedCount', () => {
    it('retorna número de aulas concluídas', async () => {
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

    it('retorna 0 quando count é null', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: null }),
          }),
        }),
      } as never);

      const count = await ProgressService.getCompletedCount('user-1');
      expect(count).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'count error' } }),
          }),
        }),
      } as never);

      await expect(ProgressService.getCompletedCount('user-1')).rejects.toThrow('count error');
    });
  });

  describe('getStudentStats', () => {
    it('retorna stats do RPC', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: [mockStats],
        error: null,
      } as never);

      const stats = await ProgressService.getStudentStats('user-1');
      expect(stats.total_lessons).toBe(10);
      expect(stats.completed_count).toBe(3);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_student_stats', { p_user_id: 'user-1' });
    });

    it('lança erro quando RPC falha', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'rpc error' },
      } as never);

      await expect(ProgressService.getStudentStats('user-1')).rejects.toThrow('rpc error');
    });

    it('lança erro quando RPC retorna array vazio', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      } as never);

      await expect(ProgressService.getStudentStats('user-1')).rejects.toThrow('Dados inválidos de get_student_stats');
    });

    it('lança erro quando RPC retorna formato inesperado (não array)', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: { total_lessons: 5 },
        error: null,
      } as never);

      await expect(ProgressService.getStudentStats('user-1')).rejects.toThrow('Dados inválidos de get_student_stats');
    });
  });
});
