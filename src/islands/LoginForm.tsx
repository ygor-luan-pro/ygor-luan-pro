import { useState, type FormEvent } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Credenciais inválidas');
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Erro ao enviar e-mail');

      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { color: 'var(--parchment)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '0.375rem' };
  const linkStyle = { fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' as const, padding: '0.25rem 0' };

  if (mode === 'reset') {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        {resetSent ? (
          <div style={{ background: 'rgba(201,133,58,0.10)', border: '1px solid rgba(201,133,58,0.25)', padding: '1rem', color: 'var(--copper)', fontSize: '0.875rem', textAlign: 'center' }}>
            Link enviado. Verifique seu e-mail.
          </div>
        ) : (
          <>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>
            {error && (
              <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </>
        )}
        <button type="button" onClick={() => setMode('login')} style={linkStyle} className="link-btn">
          Voltar ao login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label style={labelStyle}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-field"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label style={labelStyle}>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <button type="button" onClick={() => setMode('reset')} style={linkStyle} className="link-btn">
        Esqueceu a senha?
      </button>
    </form>
  );
}
