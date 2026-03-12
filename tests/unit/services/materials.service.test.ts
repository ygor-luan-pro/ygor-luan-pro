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

  describe('create', () => {
    it('insere e retorna o material criado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMaterial, error: null }),
          }),
        }),
      } as never);

      const result = await MaterialsService.create({
        lesson_id: 'lesson-1',
        title: 'Apostila de Navalha',
        file_url: 'lesson-1/abc123-apostila.pdf',
        file_type: 'application/pdf',
        file_size: 204800,
      });

      expect(result.id).toBe('mat-1');
    });

    it('lança erro quando insert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
          }),
        }),
      } as never);

      await expect(
        MaterialsService.create({ lesson_id: 'lesson-1', title: 'X', file_url: 'x.pdf', file_type: null, file_size: null }),
      ).rejects.toThrow('insert failed');
    });
  });

  describe('getById', () => {
    it('retorna material pelo ID', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMaterial, error: null }),
          }),
        }),
      } as never);

      const result = await MaterialsService.getById('mat-1');
      expect(result.id).toBe('mat-1');
    });

    it('lança erro quando material não existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      } as never);

      await expect(MaterialsService.getById('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('delete', () => {
    it('deleta material sem lançar erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      await expect(MaterialsService.delete('mat-1')).resolves.toBeUndefined();
    });

    it('lança erro quando delete falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
        }),
      } as never);

      await expect(MaterialsService.delete('invalid-id')).rejects.toThrow('not found');
    });
  });

  describe('getSignedUrl', () => {
    it('retorna URL assinada para download', async () => {
      vi.mocked(supabaseAdmin.storage.from).mockReturnValueOnce({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed.url/file.pdf' },
          error: null,
        }),
      } as never);

      const url = await MaterialsService.getSignedUrl('lesson-1/abc-file.pdf');
      expect(url).toBe('https://signed.url/file.pdf');
    });

    it('lança erro quando storage falha', async () => {
      vi.mocked(supabaseAdmin.storage.from).mockReturnValueOnce({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Object not found' },
        }),
      } as never);

      await expect(
        MaterialsService.getSignedUrl('lesson-1/missing.pdf'),
      ).rejects.toThrow('Object not found');
    });
  });

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
