import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CertificateService } from '../../../src/services/certificate.service';
import { ProgressService } from '../../../src/services/progress.service';
import { LessonsService } from '../../../src/services/lessons.service';

vi.mock('../../../src/services/progress.service');
vi.mock('../../../src/services/lessons.service');

const mockLessons = [
  { id: 'l1', is_published: true },
  { id: 'l2', is_published: true },
  { id: 'l3', is_published: true },
] as never[];

const makeProgress = (lessonId: string, completedAt: string) => ({
  id: `p-${lessonId}`,
  user_id: 'user-1',
  lesson_id: lessonId,
  completed: true,
  watch_time: 100,
  completed_at: completedAt,
});

describe('CertificateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isEligible', () => {
    it('retorna true quando completed_count === total_lessons e total > 0', async () => {
      vi.mocked(ProgressService.getStudentStats).mockResolvedValueOnce({
        total_lessons: 3,
        completed_count: 3,
        total_watch_time: 600,
      });

      const result = await CertificateService.isEligible('user-1');
      expect(result).toBe(true);
    });

    it('retorna false quando curso está incompleto', async () => {
      vi.mocked(ProgressService.getStudentStats).mockResolvedValueOnce({
        total_lessons: 3,
        completed_count: 2,
        total_watch_time: 400,
      });

      const result = await CertificateService.isEligible('user-1');
      expect(result).toBe(false);
    });

    it('retorna false quando não há aulas publicadas', async () => {
      vi.mocked(ProgressService.getStudentStats).mockResolvedValueOnce({
        total_lessons: 0,
        completed_count: 0,
        total_watch_time: 0,
      });

      const result = await CertificateService.isEligible('user-1');
      expect(result).toBe(false);
    });

    it('propaga erro do ProgressService', async () => {
      vi.mocked(ProgressService.getStudentStats).mockRejectedValueOnce(new Error('RPC error'));

      await expect(CertificateService.isEligible('user-1')).rejects.toThrow('RPC error');
    });
  });

  describe('getCompletionDate', () => {
    it('retorna o maior completed_at entre aulas publicadas concluídas', async () => {
      vi.mocked(LessonsService.getAll).mockResolvedValueOnce(mockLessons);
      vi.mocked(ProgressService.getUserProgress).mockResolvedValueOnce([
        makeProgress('l1', '2026-01-01T10:00:00Z'),
        makeProgress('l2', '2026-01-15T12:00:00Z'),
        makeProgress('l3', '2026-01-10T08:00:00Z'),
      ]);

      const result = await CertificateService.getCompletionDate('user-1');
      expect(result).toBe('2026-01-15T12:00:00Z');
    });

    it('retorna null quando não há aulas concluídas', async () => {
      vi.mocked(LessonsService.getAll).mockResolvedValueOnce(mockLessons);
      vi.mocked(ProgressService.getUserProgress).mockResolvedValueOnce([]);

      const result = await CertificateService.getCompletionDate('user-1');
      expect(result).toBeNull();
    });

    it('ignora aulas não publicadas no cálculo da data', async () => {
      vi.mocked(LessonsService.getAll).mockResolvedValueOnce(mockLessons);
      vi.mocked(ProgressService.getUserProgress).mockResolvedValueOnce([
        makeProgress('l1', '2026-01-01T10:00:00Z'),
        { ...makeProgress('l-unpublished', '2026-03-01T10:00:00Z') },
      ]);

      const result = await CertificateService.getCompletionDate('user-1');
      expect(result).toBe('2026-01-01T10:00:00Z');
    });

    it('retorna null quando completed_at é null em todos os registros', async () => {
      vi.mocked(LessonsService.getAll).mockResolvedValueOnce(mockLessons);
      vi.mocked(ProgressService.getUserProgress).mockResolvedValueOnce([
        { ...makeProgress('l1', ''), completed_at: null } as never,
      ]);

      const result = await CertificateService.getCompletionDate('user-1');
      expect(result).toBeNull();
    });
  });
});
