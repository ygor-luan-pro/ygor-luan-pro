import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CertificateService } from '../../../src/services/certificate.service';
import { ProgressService } from '../../../src/services/progress.service';
import { LessonsService } from '../../../src/services/lessons.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

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

  const mockCertificate = {
    id: 'cert-1',
    user_id: 'user-1',
    certificate_number: 'YLP-2026-00001',
    issued_at: '2026-01-15T12:00:00Z',
    completed_at: '2026-01-15T12:00:00Z',
  };

  describe('issue', () => {
    it('insere e retorna certificado emitido', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCertificate, error: null }),
          }),
        }),
      } as never);

      const result = await CertificateService.issue('user-1', '2026-01-15T12:00:00Z');
      expect(result.user_id).toBe('user-1');
      expect(result.certificate_number).toBe('YLP-2026-00001');
    });

    it('retorna certificado existente quando chamado novamente (idempotente)', async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'The result contains 0 rows' },
              }),
            }),
          }),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCertificate, error: null }),
            }),
          }),
        } as never);

      const result = await CertificateService.issue('user-1', '2026-01-15T12:00:00Z');
      expect(result.certificate_number).toBe('YLP-2026-00001');
    });

    it('propaga erro do supabase', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST500', message: 'DB error' },
            }),
          }),
        }),
      } as never);

      await expect(CertificateService.issue('user-1', '2026-01-15T12:00:00Z')).rejects.toThrow('DB error');
    });
  });

  describe('getByUserId', () => {
    it('retorna certificado quando existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCertificate, error: null }),
          }),
        }),
      } as never);

      const result = await CertificateService.getByUserId('user-1');
      expect(result?.certificate_number).toBe('YLP-2026-00001');
    });

    it('retorna null quando certificado não existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'not found' },
            }),
          }),
        }),
      } as never);

      const result = await CertificateService.getByUserId('user-1');
      expect(result).toBeNull();
    });

    it('propaga erro inesperado do supabase', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST500', message: 'DB error' },
            }),
          }),
        }),
      } as never);

      await expect(CertificateService.getByUserId('user-1')).rejects.toThrow('DB error');
    });
  });

  describe('getByCode', () => {
    it('retorna certificado com student_name quando encontrado', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockCertificate, profiles: { full_name: 'Aluno Teste' } },
              error: null,
            }),
          }),
        }),
      } as never);

      const result = await CertificateService.getByCode('YLP-2026-00001');
      expect(result?.certificate_number).toBe('YLP-2026-00001');
      expect(result?.student_name).toBe('Aluno Teste');
    });

    it('retorna null quando código inválido', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'not found' },
            }),
          }),
        }),
      } as never);

      const result = await CertificateService.getByCode('INVALIDO');
      expect(result).toBeNull();
    });
  });

  describe('getAllAdmin', () => {
    it('retorna lista de certificados com dados do aluno', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ ...mockCertificate, profiles: { full_name: 'Aluno Teste', email: 'aluno@test.com' } }],
            error: null,
          }),
        }),
      } as never);

      const result = await CertificateService.getAllAdmin();
      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Aluno Teste');
      expect(result[0].student_email).toBe('aluno@test.com');
    });

    it('retorna array vazio quando não há certificados', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const result = await CertificateService.getAllAdmin();
      expect(result).toHaveLength(0);
    });

    it('propaga erro do supabase', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      } as never);

      await expect(CertificateService.getAllAdmin()).rejects.toThrow('DB error');
    });
  });
});
