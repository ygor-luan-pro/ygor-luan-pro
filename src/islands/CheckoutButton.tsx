import { useState, type FormEvent } from 'react';
import type { ProductId } from '../types';

interface CheckoutButtonProps {
  fullWidth?: boolean;
  initialError?: string;
  productId?: ProductId;
  disabled?: boolean;
  ctaText?: string;
}

export default function CheckoutButton({
  fullWidth = false,
  initialError,
  productId = 'mentoria-completa',
  disabled = false,
  ctaText,
}: CheckoutButtonProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId }),
      });

      const data = await res.json() as { checkoutUrl?: string; error?: string };

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? 'Erro ao gerar checkout');
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tente novamente.');
      setLoading(false);
    }
  };

  const buttonLabel = loading ? 'Aguarde...' : (ctaText ?? 'Quero começar →');
  const isDisabled = loading || disabled;

  if (fullWidth) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Seu melhor e-mail"
          className="input-field mb-3"
          disabled={isDisabled}
        />
        <button type="submit" disabled={isDisabled} className="btn-primary w-full">
          {buttonLabel}
        </button>
        {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Seu melhor e-mail"
        className="input-field"
        style={{ flex: '1' }}
        disabled={isDisabled}
      />
      <button type="submit" disabled={isDisabled} className="btn-primary whitespace-nowrap">
        {buttonLabel}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.5rem', width: '100%' }}>{error}</p>}
    </form>
  );
}
