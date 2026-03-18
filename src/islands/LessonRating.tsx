import { useState, useEffect } from 'react';
import type { LessonRating } from '../types';

interface LessonRatingProps {
  lessonId: string;
  isCompleted: boolean;
  initialRating?: Pick<LessonRating, 'rating' | 'comment'> | null;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export default function LessonRating({ lessonId, isCompleted, initialRating }: LessonRatingProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [selectedRating, setSelectedRating] = useState<number>(initialRating?.rating ?? 0);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ lessonId: string }>).detail.lessonId === lessonId) {
        setCompleted(true);
      }
    };
    window.addEventListener('lesson-completed', handler);
    return () => window.removeEventListener('lesson-completed', handler);
  }, [lessonId]);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialRating?.comment ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const displayRating = hovered || selectedRating;
  const hasExisting = Boolean(initialRating?.rating);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) return;

    setStatus('saving');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/lessons/${lessonId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, comment: comment.trim() || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar avaliação');

      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado');
      setStatus('error');
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--blade)', marginTop: '2rem', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--pearl)', marginBottom: '1rem' }}>
        Avalie esta aula
      </h3>

      {!completed && (
        <p style={{ fontSize: '0.875rem', color: 'var(--fade)' }}>
          Complete a aula para avaliar.
        </p>
      )}

      {completed && (
        <form onSubmit={handleSubmit}>
          <div
            style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHovered(star)}
                aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.125rem',
                  fontSize: '1.75rem',
                  lineHeight: 1,
                  color: star <= displayRating ? '#c9853a' : 'var(--blade)',
                  transition: 'color 0.1s',
                }}
              >
                {star <= displayRating ? '★' : '☆'}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentário opcional..."
            rows={3}
            maxLength={500}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--blade)',
              color: 'var(--pearl)',
              padding: '0.625rem 0.75rem',
              fontSize: '0.875rem',
              resize: 'vertical',
              marginBottom: '0.75rem',
              boxSizing: 'border-box',
            }}
          />

          {status === 'error' && (
            <p style={{ fontSize: '0.8125rem', color: '#e55', marginBottom: '0.75rem' }}>
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={!selectedRating || status === 'saving'}
            style={{
              background: selectedRating ? 'var(--copper)' : 'var(--blade)',
              color: selectedRating ? '#000' : 'var(--fade)',
              border: 'none',
              padding: '0.5rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: selectedRating ? 'pointer' : 'not-allowed',
              letterSpacing: '0.03em',
            }}
          >
            {status === 'saving'
              ? 'Salvando...'
              : status === 'saved'
                ? '✓ Avaliação salva!'
                : hasExisting
                  ? 'Atualizar avaliação'
                  : 'Enviar avaliação'}
          </button>
        </form>
      )}
    </div>
  );
}
