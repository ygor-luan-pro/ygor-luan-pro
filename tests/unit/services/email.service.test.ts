import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/resend', () => ({
  resend: { emails: { send: vi.fn() } },
  FROM_EMAIL: 'noreply@ygorluanacademy.com.br',
}));

import { EmailService } from '../../../src/services/email.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';
import { resend } from '../../../src/lib/resend';

const mockLesson = {
  id: 'lesson-1',
  title: 'Técnicas de Degrade',
  slug: 'tecnicas-de-degrade',
  description: 'Aprenda o degrade perfeito',
  video_url: 'https://vimeo.com/123',
  thumbnail_url: null,
  duration_minutes: 30,
  module_number: 1,
  order_number: 1,
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function mockOrdersQuery(userIds: string[]) {
  vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: userIds.map((id) => ({ user_id: id })),
        error: null,
      }),
    }),
  } as never);
}

function mockProfilesQuery(students: Array<{ email: string; full_name: string | null }>) {
  vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: students, error: null }),
    }),
  } as never);
}

describe('EmailService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getActiveStudents', () => {
    it('retorna lista de alunos ativos do Supabase', async () => {
      mockOrdersQuery(['user-1']);
      mockProfilesQuery([{ email: 'aluno@exemplo.com', full_name: 'Aluno Teste' }]);

      const students = await EmailService.getActiveStudents();

      expect(students).toHaveLength(1);
      expect(students[0].email).toBe('aluno@exemplo.com');
      expect(students[0].full_name).toBe('Aluno Teste');
    });

    it('retorna array vazio quando não há pedidos aprovados', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const students = await EmailService.getActiveStudents();

      expect(students).toEqual([]);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      } as never);

      await expect(EmailService.getActiveStudents()).rejects.toThrow('DB error');
    });
  });

  describe('sendWelcome', () => {
    it('chama resend.emails.send com subject e to corretos', async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null });

      await EmailService.sendWelcome('aluno@exemplo.com', 'Aluno Teste', 'https://ygorluanacademy.com.br/login');

      expect(resend.emails.send).toHaveBeenCalledOnce();
      const callArg = vi.mocked(resend.emails.send).mock.calls[0][0];
      expect(callArg.to).toBe('aluno@exemplo.com');
      expect(callArg.subject).toContain('Bem-vindo');
      expect(callArg.html).toBeDefined();
    });

    it('não relança erro quando resend lança (fire-and-forget)', async () => {
      vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('Resend down'));

      await expect(
        EmailService.sendWelcome('aluno@exemplo.com', null, 'https://ygorluanacademy.com.br/login'),
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyNewLesson', () => {
    it('busca alunos ativos e envia email para cada um', async () => {
      mockOrdersQuery(['user-1', 'user-2']);
      mockProfilesQuery([
        { email: 'aluno1@exemplo.com', full_name: 'Aluno 1' },
        { email: 'aluno2@exemplo.com', full_name: 'Aluno 2' },
      ]);

      vi.mocked(resend.emails.send)
        .mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'msg-2' }, error: null });

      await EmailService.notifyNewLesson(mockLesson);

      expect(resend.emails.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyCertificateAvailable', () => {
    it('chama resend.emails.send com o endereço correto', async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: { id: 'msg-cert' }, error: null });

      await EmailService.notifyCertificateAvailable('aluno@exemplo.com', 'Aluno Teste');

      expect(resend.emails.send).toHaveBeenCalledOnce();
      const callArg = vi.mocked(resend.emails.send).mock.calls[0][0];
      expect(callArg.to).toBe('aluno@exemplo.com');
    });
  });

  describe('sendMentorshipReminder', () => {
    it('chama resend.emails.send com o endereço correto', async () => {
      vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: { id: 'msg-reminder' }, error: null });

      await EmailService.sendMentorshipReminder(
        'aluno@exemplo.com',
        'Aluno Teste',
        new Date('2026-03-14T15:00:00Z'),
        'https://meet.google.com/abc-defg-hij',
      );

      expect(resend.emails.send).toHaveBeenCalledOnce();
      const callArg = vi.mocked(resend.emails.send).mock.calls[0][0];
      expect(callArg.to).toBe('aluno@exemplo.com');
    });
  });
});
