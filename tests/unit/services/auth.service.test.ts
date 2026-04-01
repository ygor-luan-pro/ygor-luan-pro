import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthService } from '../../../src/services/auth.service';
import { supabase } from '../../../src/lib/supabase';

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

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
      expect(options?.redirectTo).toContain('/redefinir-senha');
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
