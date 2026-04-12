import { useState, useEffect } from 'react';
import type { LessonComment } from '../types';

type CommentWithProfile = LessonComment & {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

interface LessonCommentsProps {
  lessonId: string;
  currentUserId: string;
  isAdmin: boolean;
}

type Status = 'idle' | 'submitting' | 'error';

export default function LessonComments({ lessonId, currentUserId, isAdmin }: LessonCommentsProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/comments`)
      .then((r) => r.json())
      .then((data: { comments?: CommentWithProfile[] }) => {
        setComments(data.comments ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json() as { comment?: CommentWithProfile; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar');

      setComments((prev) => [...prev, data.comment!]);
      setContent('');
      setStatus('idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado');
      setStatus('error');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) {
        setErrorMessage('Erro ao deletar comentário. Tente novamente.');
        setStatus('error');
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setErrorMessage('Erro ao deletar comentário. Tente novamente.');
      setStatus('error');
    }
  };

  const canDelete = (comment: CommentWithProfile) =>
    comment.user_id === currentUserId || isAdmin;

  return (
    <div style={{ borderTop: '1px solid var(--blade)', marginTop: '2rem', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--pearl)', marginBottom: '1.25rem' }}>
        Comentários
        {comments.length > 0 && (
          <span style={{ fontWeight: 400, color: 'var(--fade)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
            ({comments.length})
          </span>
        )}
      </h3>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Deixe um comentário..."
          rows={3}
          maxLength={2000}
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
          <p style={{ fontSize: '0.8125rem', color: '#e55', marginBottom: '0.5rem' }}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!content.trim() || status === 'submitting'}
          style={{
            background: content.trim() ? 'var(--copper)' : 'var(--blade)',
            color: content.trim() ? '#000' : 'var(--fade)',
            border: 'none',
            padding: '0.5rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: content.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '0.03em',
          }}
        >
          {status === 'submitting' ? 'Enviando...' : 'Comentar'}
        </button>
      </form>

      {loading && (
        <p style={{ fontSize: '0.875rem', color: 'var(--fade)' }}>Carregando comentários...</p>
      )}

      {!loading && comments.length === 0 && (
        <p style={{ fontSize: '0.875rem', color: 'var(--fade)' }}>
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--blade)',
              padding: '0.875rem 1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cream)' }}>
                  {comment.profiles?.full_name ?? 'Aluno'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--fade)', marginLeft: '0.75rem' }}>
                  {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              {canDelete(comment) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  aria-label="Deletar comentário"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--fade)',
                    fontSize: '0.75rem',
                    padding: '0 0.25rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--parchment)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
