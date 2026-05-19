import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthService } from '../../../src/services/auth.service';
import { supabase } from '../../../src/lib/supabase';

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getProfile', () => {
    it('retorna perfil quando encontrado', async () => {
      const profile = {
        id: 'user-1',
        email: 'aluno@exemplo.com',
        full_name: 'Aluno Teste',
        avatar_url: 'https://cdn.example.com/avatar.png',
        role: 'student' as const,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profile, error: null }),
          }),
        }),
      } as never);

      const result = await AuthService.getProfile('user-1');
      expect(result).toEqual(profile);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('retorna null quando perfil não existe', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } }),
          }),
        }),
      } as never);

      const result = await AuthService.getProfile('user-inexistente');
      expect(result).toBeNull();
    });

    it('retorna null quando Supabase retorna erro genérico', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection lost' } }),
          }),
        }),
      } as never);

      const result = await AuthService.getProfile('user-1');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('atualiza nome e avatar do perfil', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
      } as never);

      await AuthService.updateProfile('user-1', {
        full_name: 'Novo Nome',
        avatar_url: 'https://cdn.example.com/new.png',
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Novo Nome',
          avatar_url: 'https://cdn.example.com/new.png',
          updated_at: expect.any(String),
        }),
      );
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'permission denied' } }),
        }),
      } as never);

      await expect(
        AuthService.updateProfile('user-1', { full_name: 'Nome', avatar_url: null }),
      ).rejects.toThrow('permission denied');
    });
  });

  describe('resetPassword', () => {
    it('chama resetPasswordForEmail com redirectTo apontando para /redefinir-senha', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await AuthService.resetPassword('aluno@exemplo.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledOnce();
      const [email, options] = vi.mocked(supabase.auth.resetPasswordForEmail).mock.calls[0];
      expect(email).toBe('aluno@exemplo.com');
      expect(options?.redirectTo).toContain('/auth/callback?next=/redefinir-senha');
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: { name: 'AuthApiError', message: 'User not found', status: 422 },
      } as never);

      await expect(AuthService.resetPassword('invalido@exemplo.com')).rejects.toThrow('User not found');
    });
  });
});
