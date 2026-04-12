import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RatingsService } from '../../../src/services/ratings.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

const mockRating = {
  id: 'r-1',
  user_id: 'user-1',
  lesson_id: 'lesson-1',
  rating: 4,
  comment: 'Ótima aula, muito didático!',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockRatingWithJoins = {
  ...mockRating,
  lessons: { title: 'Fundamentos do Degradê' },
  profiles: { full_name: 'Carlos Silva', email: 'carlos@example.com' },
};

describe('RatingsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUserLessonRating', () => {
    it('retorna a avaliação existente do aluno para a aula', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockRating, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await RatingsService.getUserLessonRating('user-1', 'lesson-1');

      expect(result).not.toBeNull();
      expect(result?.rating).toBe(4);
      expect(result?.comment).toBe('Ótima aula, muito didático!');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('lesson_ratings');
    });

    it('retorna null quando o aluno ainda não avaliou a aula', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await RatingsService.getUserLessonRating('user-1', 'lesson-novo');

      expect(result).toBeNull();
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            }),
          }),
        }),
      } as never);

      await expect(
        RatingsService.getUserLessonRating('user-1', 'lesson-1')
      ).rejects.toThrow('DB error');
    });
  });

  describe('upsertRating', () => {
    it('cria uma nova avaliação e a retorna', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRating, error: null }),
          }),
        }),
      } as never);

      const result = await RatingsService.upsertRating('user-1', 'lesson-1', 4, 'Ótima aula, muito didático!');

      expect(result.rating).toBe(4);
      expect(result.comment).toBe('Ótima aula, muito didático!');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('lesson_ratings');
    });

    it('atualiza avaliação existente com novo valor e comentário', async () => {
      const updated = { ...mockRating, rating: 5, comment: 'Melhor aula do curso!' };
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updated, error: null }),
          }),
        }),
      } as never);

      const result = await RatingsService.upsertRating('user-1', 'lesson-1', 5, 'Melhor aula do curso!');

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Melhor aula do curso!');
    });

    it('aceita avaliação sem comentário', async () => {
      const withoutComment = { ...mockRating, comment: null };
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: withoutComment, error: null }),
          }),
        }),
      } as never);

      const result = await RatingsService.upsertRating('user-1', 'lesson-1', 4);

      expect(result.comment).toBeNull();
    });

    it('lança erro quando upsert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'constraint violation' } }),
          }),
        }),
      } as never);

      await expect(
        RatingsService.upsertRating('user-1', 'lesson-1', 3)
      ).rejects.toThrow('constraint violation');
    });
  });

  describe('getLessonStats', () => {
    it('retorna média e total corretos para a aula', async () => {
      const ratings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: ratings, error: null }),
        }),
      } as never);

      const stats = await RatingsService.getLessonStats('lesson-1');

      expect(stats.count).toBe(3);
      expect(stats.average).toBeCloseTo(4.0);
    });

    it('retorna average 0 e count 0 quando não há avaliações', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as never);

      const stats = await RatingsService.getLessonStats('lesson-sem-votos');

      expect(stats.count).toBe(0);
      expect(stats.average).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'query error' } }),
        }),
      } as never);

      await expect(RatingsService.getLessonStats('lesson-1')).rejects.toThrow('query error');
    });
  });

  describe('getAllRatings', () => {
    it('retorna todas as avaliações com dados de aula e perfil', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockRatingWithJoins], error: null }),
        }),
      } as never);

      const ratings = await RatingsService.getAllRatings();

      expect(ratings).toHaveLength(1);
      expect(ratings[0].lessons?.title).toBe('Fundamentos do Degradê');
      expect(ratings[0].profiles?.email).toBe('carlos@example.com');
      expect(ratings[0].rating).toBe(4);
    });

    it('retorna array vazio quando não há avaliações', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const ratings = await RatingsService.getAllRatings();

      expect(ratings).toEqual([]);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fetch error' } }),
        }),
      } as never);

      await expect(RatingsService.getAllRatings()).rejects.toThrow('fetch error');
    });
  });
});
