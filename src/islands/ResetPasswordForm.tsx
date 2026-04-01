import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseBrowser = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

type FormState = 'loading' | 'error' | 'ready' | 'success';

function parseRecoveryHash(hash: string): { accessToken: string; refreshToken: string } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (type !== 'recovery' || !accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

const labelStyle = {
  color: 'var(--parchment)',
  fontSize: '0.75rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: '0.375rem',
};

export default function ResetPasswordForm() {
  const [state, setState] = useState<FormState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokens = parseRecoveryHash(window.location.hash);

    if (!tokens) {
      setErrorMessage('Link inválido ou expirado.');
      setState('error');
      return;
    }

    supabaseBrowser.auth
      .setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken })
      .then(({ error }) => {
        if (error) {
          setErrorMessage('Link inválido ou expirado. Solicite um novo.');
          setState('error');
        } else {
          setState('ready');
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirm) {
      setErrorMessage('As senhas não conferem.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabaseBrowser.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setState('success');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  if (state === 'loading') {
    return (
      <p style={{ color: 'var(--fade)', fontSize: '0.875rem', textAlign: 'center' }}>
        Verificando link...
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div
        style={{
          background: 'rgba(248,113,113,0.10)',
          border: '1px solid rgba(248,113,113,0.25)',
          padding: '1rem',
          color: '#f87171',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}
      >
        {errorMessage}
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div
        style={{
          background: 'rgba(201,133,58,0.10)',
          border: '1px solid rgba(201,133,58,0.25)',
          padding: '1rem',
          color: 'var(--copper)',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}
      >
        Senha redefinida! Redirecionando...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label style={labelStyle}>Nova senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label style={labelStyle}>Confirmar nova senha</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      {errorMessage && (
        <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{errorMessage}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  );
}
