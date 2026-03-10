import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaterialsService } from '../../../src/services/materials.service';
import { supabaseAdmin } from '../../../src/lib/supabase';

const mockMaterial = {
  id: 'mat-1',
  lesson_id: 'lesson-1',
  title: 'Apostila de Navalha',
  file_url: 'lesson-1/abc123-apostila.pdf',
  file_type: 'application/pdf',
  file_size: 204800,
  created_at: new Date().toISOString(),
};

describe('MaterialsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('getByLessonId', () => {
    it('retorna materiais de uma aula', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockMaterial], error: null }),
          }),
        }),
      } as never);

      const result = await MaterialsService.getByLessonId('lesson-1');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Apostila de Navalha');
    });

    it('retorna array vazio quando não há materiais', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);

      const result = await MaterialsService.getByLessonId('lesson-1');
      expect(result).toHaveLength(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as never);

      await expect(MaterialsService.getByLessonId('lesson-1')).rejects.toThrow('DB error');
    });
  });
});
