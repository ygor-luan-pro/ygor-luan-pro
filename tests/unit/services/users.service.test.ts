import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../../../src/services/users.service';
import { supabase } from '../../../src/lib/supabase';

const mockProfile = {
  id: 'user-1',
  email: 'aluno@test.com',
  full_name: 'Aluno Teste',
  avatar_url: null,
  role: 'student' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllAdmin', () => {
    it('retorna todos os perfis ordenados por data de criação', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockProfile], error: null }),
        }),
      } as never);

      const profiles = await UsersService.getAllAdmin();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].email).toBe('aluno@test.com');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('retorna array vazio quando não há perfis', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const profiles = await UsersService.getAllAdmin();
      expect(profiles).toHaveLength(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'forbidden' } }),
        }),
      } as never);

      await expect(UsersService.getAllAdmin()).rejects.toThrow('forbidden');
    });
  });

  describe('countStudents', () => {
    it('retorna contagem de alunos', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      } as never);

      const count = await UsersService.countStudents();
      expect(count).toBe(5);
    });

    it('retorna 0 quando não há alunos', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: null }),
        }),
      } as never);

      const count = await UsersService.countStudents();
      expect(count).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'permission denied' } }),
        }),
      } as never);

      await expect(UsersService.countStudents()).rejects.toThrow('permission denied');
    });
  });
});
