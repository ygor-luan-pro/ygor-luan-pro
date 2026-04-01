import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../src/lib/supabase';
import { AuthService } from '../../src/services/auth.service';

describe('AuthService (integration mock)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('retorna null quando perfil não existe', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      } as never);

      const profile = await AuthService.getProfile('nonexistent-id');
      expect(profile).toBeNull();
    });

    it('retorna perfil quando existe', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'aluno@test.com',
        full_name: 'Aluno Teste',
        avatar_url: null,
        role: 'student' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      } as never);

      const profile = await AuthService.getProfile('user-1');
      expect(profile?.email).toBe('aluno@test.com');
      expect(profile?.role).toBe('student');
    });
  });

  describe('resetPassword', () => {
    it('chama resetPasswordForEmail com o e-mail correto', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await AuthService.resetPassword('aluno@test.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'aluno@test.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/redefinir-senha') }),
      );
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: { message: 'Rate limit exceeded', name: 'AuthApiError', status: 429 },
      } as never);

      await expect(AuthService.resetPassword('aluno@test.com')).rejects.toThrow(
        'Rate limit exceeded',
      );
    });
  });
});
