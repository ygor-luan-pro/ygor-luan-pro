import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentsService, CommentsUnavailableError } from '../../../src/services/comments.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

vi.mock('../../../src/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

const mockComment = {
  id: 'c-1',
  user_id: 'user-1',
  lesson_id: 'lesson-1',
  content: 'Muito boa aula!',
  deleted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockCommentWithProfile = {
  ...mockComment,
  profiles: { full_name: 'Carlos Silva', avatar_url: null },
};

const mockCommentAdmin = {
  ...mockComment,
  profiles: { full_name: 'Carlos Silva', email: 'carlos@example.com' },
  lessons: { title: 'Fundamentos do Degradê' },
};

describe('CommentsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getByLesson', () => {
    it('retorna comentários não deletados da aula com perfil do autor', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [mockCommentWithProfile], error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await CommentsService.getByLesson('lesson-1');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Muito boa aula!');
      expect(result[0].profiles?.full_name).toBe('Carlos Silva');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('lesson_comments');
    });

    it('retorna array vazio quando não há comentários', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await CommentsService.getByLesson('lesson-vazia');

      expect(result).toEqual([]);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
              }),
            }),
          }),
        }),
      } as never);

      await expect(CommentsService.getByLesson('lesson-1')).rejects.toThrow('DB error');
    });

    it('retorna array vazio quando a tabela de comentários não está disponível', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: {
                    code: 'PGRST205',
                    message: "Could not find the table 'public.lesson_comments' in the schema cache",
                  },
                }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await CommentsService.getByLesson('lesson-1');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('insere e retorna o novo comentário', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
          }),
        }),
      } as never);

      const result = await CommentsService.create('user-1', 'lesson-1', 'Muito boa aula!');

      expect(result.content).toBe('Muito boa aula!');
      expect(result.user_id).toBe('user-1');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('lesson_comments');
    });

    it('lança erro quando insert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert error' } }),
          }),
        }),
      } as never);

      await expect(
        CommentsService.create('user-1', 'lesson-1', 'conteúdo')
      ).rejects.toThrow('insert error');
    });

    it('lança erro de indisponibilidade quando a tabela de comentários não existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST205',
                message: "Could not find the table 'public.lesson_comments' in the schema cache",
              },
            }),
          }),
        }),
      } as never);

      await expect(
        CommentsService.create('user-1', 'lesson-1', 'conteúdo')
      ).rejects.toBeInstanceOf(CommentsUnavailableError);
    });
  });

  describe('getOwner', () => {
    it('retorna user_id do comentário ativo', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null }),
            }),
          }),
        }),
      } as never);

      const owner = await CommentsService.getOwner('c-1');

      expect(owner).toBe('user-1');
    });

    it('retorna null quando comentário não existe ou já foi deletado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as never);

      const owner = await CommentsService.getOwner('c-inexistente');

      expect(owner).toBeNull();
    });

    it('lança erro de indisponibilidade quando a tabela de comentários não está disponível', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: 'PGRST205',
                  message: "Could not find the table 'public.lesson_comments' in the schema cache",
                },
              }),
            }),
          }),
        }),
      } as never);

      await expect(CommentsService.getOwner('c-indisponivel')).rejects.toBeInstanceOf(CommentsUnavailableError);
    });
  });

  describe('softDelete', () => {
    it('atualiza deleted_at do comentário', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: updateMock,
      } as never);

      await expect(CommentsService.softDelete('c-1')).resolves.toBeUndefined();
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(String) }));
    });

    it('lança erro quando update falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ error: { message: 'update error' } }),
          }),
        }),
      } as never);

      await expect(CommentsService.softDelete('c-1')).rejects.toThrow('update error');
    });
  });

  describe('getAllAdmin', () => {
    it('retorna todos os comentários com perfil e aula (incluindo deletados)', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [mockCommentAdmin], error: null }),
          }),
        }),
      } as never);

      const result = await CommentsService.getAllAdmin();

      expect(result).toHaveLength(1);
      expect(result[0].profiles?.email).toBe('carlos@example.com');
      expect(result[0].lessons?.title).toBe('Fundamentos do Degradê');
    });

    it('retorna array vazio quando não há comentários', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);

      const result = await CommentsService.getAllAdmin();

      expect(result).toEqual([]);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'fetch error' } }),
          }),
        }),
      } as never);

      await expect(CommentsService.getAllAdmin()).rejects.toThrow('fetch error');
    });

    it('retorna array vazio quando a tabela de comentários não está disponível', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST205',
                message: "Could not find the table 'public.lesson_comments' in the schema cache",
              },
            }),
          }),
        }),
      } as never);

      const result = await CommentsService.getAllAdmin();

      expect(result).toEqual([]);
    });
  });
});
