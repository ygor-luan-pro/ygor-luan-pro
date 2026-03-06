import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonsService } from '../../../src/services/lessons.service';
import { supabaseAdmin } from '../../../src/lib/supabase';

const mockLesson = {
  id: 'lesson-1',
  title: 'Técnicas de Navalha',
  slug: 'tecnicas-de-navalha',
  description: null,
  video_url: 'https://vimeo.com/123456',
  thumbnail_url: null,
  duration_minutes: 45,
  module_number: 1,
  order_number: 1,
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('LessonsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('retorna aulas publicadas', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [mockLesson], error: null }),
            }),
          }),
        }),
      } as never);

      const lessons = await LessonsService.getAll();
      expect(lessons).toHaveLength(1);
      expect(lessons[0].title).toBe('Técnicas de Navalha');
    });

    it('retorna array vazio quando não há aulas', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as never);

      const lessons = await LessonsService.getAll();
      expect(lessons).toHaveLength(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
              }),
            }),
          }),
        }),
      } as never);

      await expect(LessonsService.getAll()).rejects.toThrow('DB error');
    });
  });

  describe('getById', () => {
    it('retorna a aula pelo ID', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockLesson, error: null }),
          }),
        }),
      } as never);

      const lesson = await LessonsService.getById('lesson-1');
      expect(lesson.id).toBe('lesson-1');
    });

    it('lança erro quando aula não existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      } as never);

      await expect(LessonsService.getById('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('getAllAdmin', () => {
    it('retorna todas as aulas incluindo rascunhos', async () => {
      const mockDraft = { ...mockLesson, id: 'lesson-2', is_published: false };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockLesson, mockDraft], error: null }),
          }),
        }),
      } as never);

      const lessons = await LessonsService.getAllAdmin();
      expect(lessons).toHaveLength(2);
      expect(lessons.some(l => !l.is_published)).toBe(true);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'forbidden' } }),
          }),
        }),
      } as never);

      await expect(LessonsService.getAllAdmin()).rejects.toThrow('forbidden');
    });
  });

  describe('create', () => {
    it('cria e retorna a nova aula', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockLesson, error: null }),
          }),
        }),
      } as never);

      const input = {
        title: 'Técnicas de Navalha',
        slug: 'tecnicas-de-navalha',
        description: null,
        video_url: 'https://vimeo.com/123456',
        thumbnail_url: null,
        duration_minutes: 45,
        module_number: 1,
        order_number: 1,
        is_published: true,
      };

      const lesson = await LessonsService.create(input);
      expect(lesson.title).toBe('Técnicas de Navalha');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('lessons');
    });

    it('lança erro quando insert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate key' } }),
          }),
        }),
      } as never);

      await expect(
        LessonsService.create({ ...mockLesson, id: undefined } as never),
      ).rejects.toThrow('duplicate key');
    });
  });

  describe('update', () => {
    it('atualiza e retorna a aula modificada', async () => {
      const updated = { ...mockLesson, title: 'Título Atualizado' };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      } as never);

      const lesson = await LessonsService.update('lesson-1', { title: 'Título Atualizado' });
      expect(lesson.title).toBe('Título Atualizado');
    });

    it('lança erro quando update falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
            }),
          }),
        }),
      } as never);

      await expect(LessonsService.update('invalid-id', { title: 'x' })).rejects.toThrow('not found');
    });
  });

  describe('togglePublish', () => {
    it('publica a aula sem lançar erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      await expect(LessonsService.togglePublish('lesson-1', true)).resolves.toBeUndefined();
    });

    it('despublica a aula sem lançar erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      await expect(LessonsService.togglePublish('lesson-1', false)).resolves.toBeUndefined();
    });

    it('lança erro quando update falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      } as never);

      await expect(LessonsService.togglePublish('lesson-1', true)).rejects.toThrow('DB error');
    });
  });
});
