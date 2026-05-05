import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

type FormState = 'loading' | 'error' | 'ready' | 'success';

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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
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

    setLoading(true);
    setErrorMessage(null);

    const isRecovery = new URLSearchParams(window.location.search).get('recovery') === '1';

    const res = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, isRecovery }),
    });

    const data = await res.json() as { error?: string; reasons?: string[] };

    if (!res.ok) {
      const msg = data.reasons?.join(' ') ?? data.error ?? 'Erro ao redefinir senha.';
      setErrorMessage(msg);
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
        <br />
        <a
          href="/login"
          style={{
            color: 'var(--copper)',
            textDecoration: 'underline',
            marginTop: '0.5rem',
            display: 'inline-block',
          }}
        >
          Solicitar novo link
        </a>
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
        Senha redefinida! Redirecionando para o login...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-password" style={labelStyle}>Nova senha</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" style={labelStyle}>Confirmar nova senha</label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
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
