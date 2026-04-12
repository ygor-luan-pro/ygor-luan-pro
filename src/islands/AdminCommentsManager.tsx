import { useState, useEffect } from 'react';
import type { LessonComment } from '../types';

type CommentAdmin = LessonComment & {
  profiles: { full_name: string | null; email: string } | null;
  lessons: { title: string } | null;
};

export default function AdminCommentsManager() {
  const [comments, setComments] = useState<CommentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/comments')
      .then((r) => r.json())
      .then((data: { comments?: CommentAdmin[]; error?: string }) => {
        if (data.error) { setError(data.error); return; }
        setComments(data.comments ?? []);
      })
      .catch(() => setError('Erro ao carregar comentários.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) return;
      setComments((prev) => prev.map((c) =>
        c.id === commentId ? { ...c, deleted_at: new Date().toISOString() } : c,
      ));
    } catch {
      // silently ignore
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--fade)', fontSize: '0.875rem' }}>Carregando...</p>;
  }

  if (error) {
    return (
      <div style={{ border: '1px solid red', padding: '1.5rem', color: 'var(--copper)' }}>
        Erro: {error}
      </div>
    );
  }

  const active = comments.filter((c) => !c.deleted_at);
  const deleted = comments.filter((c) => c.deleted_at);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--mahogany)', border: '1px solid var(--ink)', padding: '0.75rem 1.25rem', textAlign: 'right' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fade)', marginBottom: '0.25rem' }}>Ativos</p>
          <p style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1.25rem', color: 'var(--copper)' }}>{active.length}</p>
        </div>
        <div style={{ background: 'var(--mahogany)', border: '1px solid var(--ink)', padding: '0.75rem 1.25rem', textAlign: 'right' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fade)', marginBottom: '0.25rem' }}>Deletados</p>
          <p style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1.25rem', color: 'var(--fade)' }}>{deleted.length}</p>
        </div>
      </div>

      {comments.length === 0 ? (
        <div style={{ background: 'var(--mahogany)', border: '1px solid var(--ink)', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--fade)' }}>Nenhum comentário registrado ainda.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--mahogany)', border: '1px solid var(--ink)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ink)' }}>
                  {['Aula', 'Aluno', 'Comentário', 'Data', 'Status', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fade)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--ink)', opacity: c.deleted_at ? 0.5 : 1 }}>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--parchment)', maxWidth: '160px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.lessons?.title ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--parchment)' }}>
                      <div>{c.profiles?.full_name ?? '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fade)' }}>{c.profiles?.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--parchment)', maxWidth: '280px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.content}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--fade)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: c.deleted_at ? '#e55' : 'var(--copper)' }}>
                      {c.deleted_at ? 'Deletado' : 'Ativo'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {!c.deleted_at && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--blade)',
                            color: '#e55',
                            padding: '0.25rem 0.625rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Deletar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
