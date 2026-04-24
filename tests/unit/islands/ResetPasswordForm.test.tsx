// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

import ResetPasswordForm from '../../../src/islands/ResetPasswordForm';

function mockFetch(ok: boolean, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  }));
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { href: '', search: '?recovery=1' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra erro quando não há sessão ativa (getUser retorna null)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(
        screen.getByText('Link inválido ou expirado. Solicite um novo.'),
      ).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando getUser retornar usuário nulo', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(
        screen.getByText('Link inválido ou expirado. Solicite um novo.'),
      ).toBeInTheDocument();
    });
  });

  it('mostra formulário quando o token de recovery é válido', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });
  });

  it('mostra erro quando as senhas não conferem', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'senha123' } });
    fireEvent.change(confirmar, { target: { value: 'diferente' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument();
  });

  it('mostra erro quando endpoint retornar erro', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });
    mockFetch(false, { error: 'Senha muito fraca' });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'senha123' } });
    fireEvent.change(confirmar, { target: { value: 'senha123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Senha muito fraca')).toBeInTheDocument();
    });
  });

  it('mostra razões de política quando endpoint retornar 422', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });
    mockFetch(false, { error: 'Senha inválida', reasons: ['A senha deve ter no mínimo 8 caracteres.'] });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'curta' } });
    fireEvent.change(confirmar, { target: { value: 'curta' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument();
    });
  });

  it('redireciona para /login após sucesso', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });
    mockFetch(true, { ok: true });

    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'novaSenha123' } });
    fireEvent.change(confirmar, { target: { value: 'novaSenha123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Senha redefinida/i)).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(window.location.href).toBe('/login');

    vi.useRealTimers();
  });
});
